'use client';

import { useCallback } from 'react';

import { getProjectsPageAction } from '@/entities/project/api/mutations/project-actions';
import type { ProjectListItem } from '@/entities/project/model/types';
import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import { useOffsetPaginationFeed } from '@/shared/lib/react/use-offset-pagination-feed';

type UseProjectFeedOptions = {
  initialCursor: string | null;
  initialItems: ProjectListItem[];
  locale: string;
};

const PROJECT_FEED_LOAD_ERROR_CODE = 'projectFeed.loadFailed';

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
      const result = await getProjectsPageAction({
        cursor,
        limit,
        locale: nextLocale,
      });

      if (!result.ok || !result.data) {
        throw new Error(result.errorCode ?? result.errorMessage ?? PROJECT_FEED_LOAD_ERROR_CODE);
      }

      return {
        items: result.data.items,
        nextCursor: result.data.nextCursor,
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
