'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { ArticleCommentPage, ArticleCommentsSort } from '@/entities/article/comment/model';
import { getArticleCommentsPageAction } from '@/features/article-comment/api/get-article-comments-page';
import { articleComments } from '@/shared/lib/query/query-keys';

/**
 * 댓글 페이지 응답을 신선한 상태로 간주하는 시간(밀리초)입니다.
 * 기존 브라우저 Map 캐시의 60초 TTL을 React Query `staleTime`으로 재현합니다.
 */
const ARTICLE_COMMENTS_PAGE_STALE_TIME_MS = 60_000;

type UseArticleCommentsPageParams = {
  articleId: string;
  initialData?: ArticleCommentPage;
  locale: string;
  page: number;
  sort: ArticleCommentsSort;
};

/**
 * 특정 글·정렬·페이지의 댓글 목록을 React Query로 조회하는 훅입니다.
 *
 * 페이지/정렬 상태는 소비 위젯의 로컬 `useState`가 소유하고, 그 값이 이 훅의
 * 쿼리 키(`articleComments.page`)를 구동합니다. 조회 액션이 실패
 * (`ok === false` 또는 `data` 없음)하면 `errorMessage`를 담은 `Error`를 던져
 * React Query의 `error` 채널로 흘려보냅니다.
 *
 * `placeholderData: keepPreviousData`로 페이지/정렬 전환 중에도 직전 페이지를
 * 유지해 스켈레톤 깜빡임을 없앱니다. 서버가 넘겨준 첫 페이지가 있으면
 * 해당 키에 한해 `initialData`로 시드해 마운트 직후 추가 조회 없이 렌더합니다.
 *
 * @param params 대상 글 id, locale, 조회할 페이지/정렬, 선택적 초기 페이지 데이터입니다.
 * @returns React Query의 `useQuery` 결과 객체입니다.
 */
export const useArticleCommentsPage = ({
  articleId,
  initialData,
  locale,
  page,
  sort,
}: UseArticleCommentsPageParams) => {
  const hasMatchingInitialData =
    initialData !== undefined && initialData.page === page && initialData.sort === sort;

  return useQuery({
    initialData: hasMatchingInitialData ? initialData : undefined,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const result = await getArticleCommentsPageAction({
        articleId,
        locale,
        page,
        sort,
      });

      if (!result.ok || !result.data) {
        throw new Error(result.errorMessage ?? 'article-comments-load-failed');
      }

      return result.data;
    },
    queryKey: articleComments.page(articleId, locale, sort, page),
    staleTime: ARTICLE_COMMENTS_PAGE_STALE_TIME_MS,
  });
};
