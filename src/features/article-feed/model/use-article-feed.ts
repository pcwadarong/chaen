'use client';

import { useCallback } from 'react';

import type { ArticleListItem } from '@/entities/article/model/types';
import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import { requestJsonApiClient } from '@/shared/lib/http/request-json-api-client';
import { useOffsetPaginationFeed } from '@/shared/lib/react/use-offset-pagination-feed';

type ArticleFeedResponse = {
  items: ArticleListItem[];
  nextCursor: string | null;
  ok: true;
  totalCount?: number | null;
};

type UseArticleFeedOptions = {
  activeTag: string;
  initialCursor: string | null;
  initialItems: ArticleListItem[];
  locale: string;
  query: string;
};

/**
 * 아티클 목록 무한 스크롤 상태를 관리합니다.
 */
export const useArticleFeed = ({
  activeTag,
  initialCursor,
  initialItems,
  locale,
  query,
}: UseArticleFeedOptions) => {
  const loadPage = useCallback(
    async ({
      cursor,
      limit,
      locale: nextLocale,
      queryParams,
    }: {
      cursor: string;
      limit: number;
      locale: string;
      queryParams?: Record<string, string | null | undefined>;
    }) => {
      const url = new URL('/api/articles', window.location.origin);
      url.searchParams.set('locale', nextLocale);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('cursor', cursor);

      Object.entries(queryParams ?? {}).forEach(([key, value]) => {
        if (!value) return;
        url.searchParams.set(key, value);
      });

      const payload = await requestJsonApiClient<ArticleFeedResponse>({
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
        totalCount: payload.totalCount,
      };
    },
    [],
  );

  return useOffsetPaginationFeed<ArticleListItem>({
    initialCursor,
    initialItems,
    locale,
    loadPage,
    mergeItems: (previousItems, incomingItems) => dedupeById([...previousItems, ...incomingItems]),
    queryParams: {
      q: query,
      tag: activeTag,
    },
  });
};
