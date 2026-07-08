'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import type { ArticleListItem } from '@/entities/article/model/types';
import type { AppLocale } from '@/i18n/routing';
import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import { getErrorMessage } from '@/shared/lib/error/get-error-message';
import { articles } from '@/shared/lib/query/query-keys';

type UseBrowseArticlesOptions = {
  activeTag: string;
  initialCursor: string | null;
  initialItems: ArticleListItem[];
  locale: string;
  query: string;
};

type ArticlesFeedPage = {
  items: ArticleListItem[];
  nextCursor: string | null;
  totalCount?: number | null;
};

const ARTICLE_FEED_LOAD_ERROR_CODE = 'articleFeed.loadFailed';
const ARTICLE_FEED_PAGE_LIMIT = 10;

/**
 * 아티클 페이지 응답을 JSON으로 읽고 실패 시 메시지를 정규화합니다.
 *
 * @param requestUrl 조회할 `/api/articles` 요청 URL입니다.
 * @param signal React Query가 전달하는 요청 취소 시그널입니다.
 * @returns 아티클 페이지 응답(항목·다음 커서)입니다.
 */
const readArticlesFeedPage = async (
  requestUrl: string,
  signal?: AbortSignal,
): Promise<ArticlesFeedPage> => {
  const response = await fetch(requestUrl, {
    method: 'GET',
    signal,
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;

    throw new Error(errorPayload?.error ?? ARTICLE_FEED_LOAD_ERROR_CODE);
  }

  return response.json() as Promise<ArticlesFeedPage>;
};

/**
 * 아티클 목록 무한 스크롤 상태를 관리합니다.
 *
 * 서버가 넘겨준 첫 페이지는 `initialData`로 시드하고 `staleTime: Infinity`로
 * 자동 refetch를 막아, 서버 렌더 결과를 그대로 재사용합니다. locale/검색어/태그가
 * 바뀌면 쿼리 키가 갈라지며 새 시드로 초기화됩니다. 반환 계약은 기존
 * `useCursorPaginationFeed`와 동일하므로 소비 컴포넌트는 변경되지 않습니다.
 */
export const useBrowseArticles = ({
  activeTag,
  initialCursor,
  initialItems,
  locale,
  query,
}: UseBrowseArticlesOptions) => {
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    getNextPageParam: lastPage => lastPage.nextCursor,
    initialData: {
      pageParams: [null],
      pages: [{ items: initialItems, nextCursor: initialCursor }],
    },
    initialPageParam: initialCursor,
    queryFn: async ({ pageParam, signal }) => {
      const searchParams = new URLSearchParams({
        cursor: pageParam ?? '',
        limit: String(ARTICLE_FEED_PAGE_LIMIT),
        locale,
      });

      if (query) {
        searchParams.set('q', query);
      }

      if (activeTag) {
        searchParams.set('tag', activeTag);
      }

      return readArticlesFeedPage(`/api/articles?${searchParams.toString()}`, signal);
    },
    queryKey: articles.feed({ locale: locale as AppLocale, q: query, tag: activeTag }),
    staleTime: Infinity,
  });

  const items = useMemo(() => dedupeById((data?.pages ?? []).flatMap(page => page.items)), [data]);

  const loadMore = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return;

    await fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return {
    errorMessage: error ? getErrorMessage(error) : null,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    items,
    loadMore,
  };
};
