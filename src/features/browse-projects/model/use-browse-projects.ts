'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import type { ProjectListItem } from '@/entities/project/model/types';
import type { AppLocale } from '@/i18n/routing';
import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import { getErrorMessage } from '@/shared/lib/error/get-error-message';
import { projects } from '@/shared/lib/query/query-keys';

type UseBrowseProjectsOptions = {
  initialCursor: string | null;
  initialItems: ProjectListItem[];
  locale: string;
};

type ProjectsFeedPage = {
  items: ProjectListItem[];
  nextCursor: string | null;
};

const PROJECT_FEED_LOAD_ERROR_CODE = 'projectFeed.loadFailed';
const PROJECT_FEED_PAGE_LIMIT = 10;

/**
 * 프로젝트 페이지 응답을 JSON으로 읽고 실패 시 메시지를 정규화합니다.
 *
 * @param requestUrl 조회할 `/api/projects` 요청 URL입니다.
 * @param signal React Query가 전달하는 요청 취소 시그널입니다.
 * @returns 프로젝트 페이지 응답(항목·다음 커서)입니다.
 */
const readProjectsFeedPage = async (
  requestUrl: string,
  signal?: AbortSignal,
): Promise<ProjectsFeedPage> => {
  const response = await fetch(requestUrl, {
    method: 'GET',
    signal,
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;

    throw new Error(errorPayload?.error ?? PROJECT_FEED_LOAD_ERROR_CODE);
  }

  return response.json() as Promise<ProjectsFeedPage>;
};

/**
 * 프로젝트 목록 무한 스크롤 상태를 관리합니다.
 *
 * 서버가 넘겨준 첫 페이지는 `initialData`로 시드하고 `staleTime: Infinity`로
 * 자동 refetch를 막아, 서버 렌더 결과를 그대로 재사용합니다. locale이 바뀌면
 * 쿼리 키가 갈라지며 새 시드로 초기화됩니다. 반환 계약은 기존
 * `useCursorPaginationFeed`와 동일하므로 소비 컴포넌트는 변경되지 않습니다.
 */
export const useBrowseProjects = ({
  initialCursor,
  initialItems,
  locale,
}: UseBrowseProjectsOptions) => {
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
        limit: String(PROJECT_FEED_PAGE_LIMIT),
        locale,
      });

      return readProjectsFeedPage(`/api/projects?${searchParams.toString()}`, signal);
    },
    queryKey: projects.feed(locale as AppLocale),
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
