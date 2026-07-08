import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache';

import type {
  ArticleComment,
  ArticleCommentPage,
  ArticleCommentRow,
  ArticleCommentsSort,
  ArticleCommentThreadItem,
} from '@/entities/article/comment/model';
import {
  ARTICLE_COMMENTS_CACHE_TAG,
  createArticleCommentCacheTag,
  createArticleCommentsCacheTag,
} from '@/entities/article/comment/model';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

const DEFAULT_PAGE_SIZE = 10;

type GetArticleCommentsOptions = {
  articleId: string;
  bypassCache?: boolean;
  page?: number;
  pageSize?: number;
  sort?: ArticleCommentsSort;
};

/**
 * page 값을 1 이상 정수로 정규화합니다.
 */
const normalizePage = (page?: number) => {
  if (!page || Number.isNaN(page) || page < 1) return 1;

  return Math.floor(page);
};

/**
 * sort 값을 허용된 댓글 정렬 값으로 정규화합니다.
 */
const normalizeSort = (sort?: string | null): ArticleCommentsSort =>
  sort === 'oldest' ? 'oldest' : 'latest';

/**
 * DB row를 공개 댓글 타입으로 변환합니다.
 */
const toPublicArticleComment = (comment: ArticleCommentRow): ArticleComment => {
  const { password_hash: _passwordHash, ...publicComment } = comment;

  return publicComment;
};

/**
 * 화면에 노출되는 댓글 엔트리 수를 계산합니다.
 * 루트 댓글 1개와 그 아래 대댓글 개수를 함께 합산합니다.
 */
const countVisibleEntries = (thread: ArticleCommentThreadItem) => 1 + thread.replies.length;

/**
 * 스레드를 끊지 않으면서 화면 엔트리 수 기준으로 페이지를 분할합니다.
 */
const paginateThreadsByVisibleEntries = (
  threads: ArticleCommentThreadItem[],
  pageSize: number,
  page: number,
) => {
  if (threads.length === 0) {
    return {
      currentPage: 1,
      items: [],
      totalCount: 0,
      totalPages: 0,
    };
  }

  const pages = threads.reduce<ArticleCommentThreadItem[][]>((accumulator, thread) => {
    const visibleEntryCount = countVisibleEntries(thread);
    const currentPageItems = accumulator.at(-1);

    if (!currentPageItems) return [[thread]];

    const currentPageCount = currentPageItems.reduce(
      (count, pageThread) => count + countVisibleEntries(pageThread),
      0,
    );

    if (currentPageItems.length > 0 && currentPageCount + visibleEntryCount > pageSize) {
      accumulator.push([thread]);
      return accumulator;
    }

    currentPageItems.push(thread);
    return accumulator;
  }, []);
  const totalCount = threads.reduce((count, thread) => count + countVisibleEntries(thread), 0);
  const totalPages = pages.length;
  const currentPage = Math.min(page, totalPages);

  return {
    currentPage,
    items: pages[currentPage - 1] ?? [],
    totalCount,
    totalPages,
  };
};

/**
 * 아티클의 루트 댓글을 정렬 순서에 맞춰 모두 조회합니다.
 */
const fetchArticleCommentRoots = async (
  articleId: string,
  sort: ArticleCommentsSort,
): Promise<ArticleCommentRow[]> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('article_comments')
    .select('*')
    .eq('article_id', articleId)
    .is('parent_id', null)
    .order('created_at', { ascending: sort === 'oldest' });

  if (error) throw new Error(`[article-comments] 루트 댓글 조회 실패: ${error.message}`);

  return (data ?? []) as ArticleCommentRow[];
};

/**
 * 전달된 루트 댓글 id 목록의 대댓글을 단일 `.in()` 쿼리로 조회해 parent별로 그룹핑합니다.
 *
 * parent별 개별 조회(N+1) 대신 한 번의 쿼리로 읽고, 모든 parentId를 빈 배열로 초기화한 뒤
 * `created_at` 오름차순 정렬 결과를 순서대로 담아 parent 내부 순서를 보존합니다.
 */
const fetchRepliesByParentIds = async (
  parentIds: string[],
): Promise<Record<string, ArticleCommentRow[]>> => {
  if (parentIds.length === 0) return {};

  const repliesByParentId: Record<string, ArticleCommentRow[]> = Object.fromEntries(
    parentIds.map(parentId => [parentId, []]),
  );

  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return repliesByParentId;

  const { data, error } = await supabase
    .from('article_comments')
    .select('*')
    .in('parent_id', parentIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`[article-comments] 대댓글 조회 실패: ${error.message}`);

  (data ?? []).forEach(reply => {
    const typedReply = reply as ArticleCommentRow;
    if (typedReply.parent_id && repliesByParentId[typedReply.parent_id]) {
      repliesByParentId[typedReply.parent_id].push(typedReply);
    }
  });

  return repliesByParentId;
};

/**
 * 루트 댓글과 대댓글을 묶은 전체 스레드 목록을 생성합니다.
 */
const readArticleCommentThreads = async (
  articleId: string,
  sort: ArticleCommentsSort,
): Promise<ArticleCommentThreadItem[]> => {
  const roots = await fetchArticleCommentRoots(articleId, sort);
  const repliesByParentId = await fetchRepliesByParentIds(roots.map(root => root.id));

  return roots.flatMap(root => {
    const replies = (repliesByParentId[root.id] ?? []).map(toPublicArticleComment);
    const shouldHideDeletedRoot = Boolean(root.deleted_at) && replies.length === 0;

    if (shouldHideDeletedRoot) return [];

    return [
      {
        ...toPublicArticleComment(root),
        replies,
      },
    ];
  });
};

/**
 * 댓글 스레드 전체 목록을 `use cache`로 캐시합니다.
 */
const readCachedArticleCommentThreads = async (
  articleId: string,
  sort: ArticleCommentsSort,
): Promise<ArticleCommentThreadItem[]> => {
  'use cache';

  const threads = await readArticleCommentThreads(articleId, sort);
  const commentTags = threads.flatMap(thread => [
    createArticleCommentCacheTag(thread.id),
    ...thread.replies.map(reply => createArticleCommentCacheTag(reply.id)),
  ]);

  cacheTag(ARTICLE_COMMENTS_CACHE_TAG, createArticleCommentsCacheTag(articleId), ...commentTags);
  // UGC라 태그 무효화가 늦어도 짧은 TTL로 신선도를 유지함.
  cacheLife({ expire: 3600, revalidate: 300, stale: 60 });

  return threads;
};

/**
 * 아티클 댓글 페이지 데이터를 반환합니다.
 */
export const getArticleComments = async ({
  articleId,
  bypassCache = false,
  page,
  pageSize = DEFAULT_PAGE_SIZE,
  sort = 'latest',
}: GetArticleCommentsOptions): Promise<ArticleCommentPage> => {
  const normalizedArticleId = articleId.trim();
  const normalizedPage = normalizePage(page);
  const normalizedSort = normalizeSort(sort);

  if (!normalizedArticleId || !hasSupabaseEnv()) {
    return {
      items: [],
      page: 1,
      pageSize,
      sort: normalizedSort,
      totalCount: 0,
      totalPages: 0,
    };
  }

  const threads = bypassCache
    ? await readArticleCommentThreads(normalizedArticleId, normalizedSort)
    : await readCachedArticleCommentThreads(normalizedArticleId, normalizedSort);
  const { currentPage, items, totalCount, totalPages } = paginateThreadsByVisibleEntries(
    threads,
    pageSize,
    normalizedPage,
  );

  return {
    items,
    page: currentPage,
    pageSize,
    sort: normalizedSort,
    totalCount,
    totalPages,
  };
};
