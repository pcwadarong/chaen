import type {
  ArticleComment,
  ArticleCommentPage,
  ArticleCommentsSort,
} from '@/entities/article-comment/model/types';
import { requestJsonApiClient } from '@/shared/lib/http/request-json-api-client';

type CreateArticleCommentClientInput = {
  authorBlogUrl: string;
  authorName: string;
  content: string;
  parentId?: string | null;
  password: string;
  replyToCommentId?: string | null;
};

type GetArticleCommentsClientParams = {
  fresh?: boolean;
  page: number;
  sort: ArticleCommentsSort;
};

type ArticleCommentMutationResponse = {
  comment: ArticleComment;
  ok: true;
};

type ArticleCommentPageResponse = ArticleCommentPage & {
  ok: true;
};

/**
 * 아티클 댓글 목록 페이지를 클라이언트에서 조회합니다.
 */
export const getArticleCommentsPageClient = async (
  articleId: string,
  { fresh = false, page, sort }: GetArticleCommentsClientParams,
): Promise<ArticleCommentPage> => {
  const url = new URL(`/api/articles/${articleId}/comments`, window.location.origin);
  if (fresh) url.searchParams.set('fresh', '1');
  url.searchParams.set('page', String(page));
  url.searchParams.set('sort', sort);

  const payload = await requestJsonApiClient<ArticleCommentPageResponse>({
    fallbackReason: 'failed to fetch article comments',
    init: {
      cache: 'no-store',
    },
    method: 'GET',
    url: url.toString(),
  });

  return {
    items: payload.items,
    page: payload.page,
    pageSize: payload.pageSize,
    sort: payload.sort,
    totalCount: payload.totalCount,
    totalPages: payload.totalPages,
  };
};

/**
 * 신규 아티클 댓글 또는 대댓글을 생성합니다.
 */
export const createArticleCommentClient = async (
  articleId: string,
  input: CreateArticleCommentClientInput,
): Promise<ArticleComment> => {
  const payload = await requestJsonApiClient<ArticleCommentMutationResponse>({
    body: input,
    fallbackReason: 'failed to create article comment',
    method: 'POST',
    url: `/api/articles/${articleId}/comments`,
  });

  return payload.comment;
};

/**
 * 비밀번호 검증 후 아티클 댓글을 수정합니다.
 */
export const updateArticleCommentClient = async (
  articleId: string,
  commentId: string,
  content: string,
  password: string,
): Promise<ArticleComment> => {
  const payload = await requestJsonApiClient<ArticleCommentMutationResponse>({
    body: {
      content,
      password,
    },
    fallbackReason: 'failed to update article comment',
    method: 'PATCH',
    url: `/api/articles/${articleId}/comments/${commentId}`,
  });

  return payload.comment;
};

/**
 * 비밀번호 검증 후 아티클 댓글을 삭제합니다.
 */
export const deleteArticleCommentClient = async (
  articleId: string,
  commentId: string,
  password: string,
) => {
  await requestJsonApiClient<{ deletedId: string; ok: true }>({
    body: {
      password,
    },
    fallbackReason: 'failed to delete article comment',
    method: 'DELETE',
    url: `/api/articles/${articleId}/comments/${commentId}`,
  });
};
