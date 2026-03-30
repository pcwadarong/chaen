'use client';

import { useCallback } from 'react';

import type { ProjectListItem } from '@/entities/project/model/types';
import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import { useCursorPaginationFeed } from '@/shared/lib/react/use-cursor-pagination-feed';

type UseBrowseProjectsOptions = {
  initialCursor: string | null;
  initialItems: ProjectListItem[];
  locale: string;
};

const PROJECT_FEED_LOAD_ERROR_CODE = 'projectFeed.loadFailed';

/**
 * 프로젝트 페이지 응답을 JSON으로 읽고 실패 시 메시지를 정규화합니다.
 */
const readProjectsFeedPage = async (requestUrl: string) => {
  const response = await fetch(requestUrl, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;

    throw new Error(errorPayload?.error ?? PROJECT_FEED_LOAD_ERROR_CODE);
  }

  return response.json() as Promise<{
    items: ProjectListItem[];
    nextCursor: string | null;
  }>;
};

/**
 * 프로젝트 목록 무한 스크롤 상태를 관리합니다.
 */
export const useBrowseProjects = ({
  initialCursor,
  initialItems,
  locale,
}: UseBrowseProjectsOptions) => {
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
      const searchParams = new URLSearchParams({
        cursor,
        limit: String(limit),
        locale: nextLocale,
      });

      const result = await readProjectsFeedPage(`/api/projects?${searchParams.toString()}`);

      return {
        items: result.items,
        nextCursor: result.nextCursor,
      };
    },
    [],
  );

  return useCursorPaginationFeed<ProjectListItem>({
    initialCursor,
    initialItems,
    locale,
    loadPage,
    mergeItems: (previousItems, incomingItems) => dedupeById([...previousItems, ...incomingItems]),
    resetKey: locale,
  });
};
