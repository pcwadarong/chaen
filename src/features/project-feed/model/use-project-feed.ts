'use client';

import type { Project } from '@/entities/project/model/types';
import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import { useOffsetPaginationFeed } from '@/shared/lib/react/use-offset-pagination-feed';

type UseProjectFeedOptions = {
  initialCursor: string | null;
  initialItems: Project[];
  locale: string;
};

/**
 * 프로젝트 목록 무한 스크롤 상태를 관리합니다.
 */
export const useProjectFeed = ({ initialCursor, initialItems, locale }: UseProjectFeedOptions) =>
  useOffsetPaginationFeed<Project>({
    endpoint: '/api/projects',
    initialCursor,
    initialItems,
    locale,
    mergeItems: (previousItems, incomingItems) => dedupeById([...previousItems, ...incomingItems]),
  });
