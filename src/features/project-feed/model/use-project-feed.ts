'use client';

import { useCallback } from 'react';

import type { ProjectListItem } from '@/entities/project/model/types';
import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import { requestJsonApiClient } from '@/shared/lib/http/request-json-api-client';
import { useOffsetPaginationFeed } from '@/shared/lib/react/use-offset-pagination-feed';

type ProjectFeedResponse = {
  items: ProjectListItem[];
  nextCursor: string | null;
  ok: true;
};

type UseProjectFeedOptions = {
  initialCursor: string | null;
  initialItems: ProjectListItem[];
  locale: string;
};

/**
 * 프로젝트 목록 무한 스크롤 상태를 관리합니다.
 */
export const useProjectFeed = ({ initialCursor, initialItems, locale }: UseProjectFeedOptions) => {
  const loadPage = useCallback(
    async ({
      cursor,
      limit,
      locale: nextLocale,
    }: {
      cursor: string;
      limit: number;
      locale: string;
    }) => {
      const url = new URL('/api/projects', window.location.origin);
      url.searchParams.set('locale', nextLocale);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('cursor', cursor);

      const payload = await requestJsonApiClient<ProjectFeedResponse>({
        fallbackReason: 'failed to fetch list',
        init: {
          cache: 'no-store',
        },
        method: 'GET',
        url: url.toString(),
      });

      return {
        items: payload.items,
        nextCursor: payload.nextCursor,
      };
    },
    [],
  );

  return useOffsetPaginationFeed<ProjectListItem>({
    initialCursor,
    initialItems,
    locale,
    loadPage,
    mergeItems: (previousItems, incomingItems) => dedupeById([...previousItems, ...incomingItems]),
  });
};
