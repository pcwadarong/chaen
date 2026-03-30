'use client';

import { useCallback } from 'react';

import type { ArticleListItem } from '@/entities/article/model/types';
import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import { useCursorPaginationFeed } from '@/shared/lib/react/use-cursor-pagination-feed';

type UseBrowseArticlesOptions = {
  activeTag: string;
  initialCursor: string | null;
  initialItems: ArticleListItem[];
  locale: string;
  query: string;
};

const ARTICLE_FEED_LOAD_ERROR_CODE = 'articleFeed.loadFailed';

/**
 * 아티클 페이지 응답을 JSON으로 읽고 실패 시 메시지를 정규화합니다.
 */
const readArticlesFeedPage = async (requestUrl: string) => {
  const response = await fetch(requestUrl, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;

    throw new Error(errorPayload?.error ?? ARTICLE_FEED_LOAD_ERROR_CODE);
  }

  return response.json() as Promise<{
    items: ArticleListItem[];
    nextCursor: string | null;
    totalCount?: number | null;
  }>;
};

/**
 * 아티클 목록 무한 스크롤 상태를 관리합니다.
 */
export const useBrowseArticles = ({
  activeTag,
  initialCursor,
  initialItems,
  locale,
  query,
}: UseBrowseArticlesOptions) => {
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
      const searchParams = new URLSearchParams({
        cursor,
        limit: String(limit),
        locale: nextLocale,
      });

      if (queryParams?.q) {
        searchParams.set('q', queryParams.q);
      }

      if (queryParams?.tag) {
        searchParams.set('tag', queryParams.tag);
      }

      const result = await readArticlesFeedPage(`/api/articles?${searchParams.toString()}`);

      return {
        items: result.items,
        nextCursor: result.nextCursor,
        totalCount: result.totalCount,
      };
    },
    [],
  );

  return useCursorPaginationFeed<ArticleListItem>({
    initialCursor,
    initialItems,
    locale,
    loadPage,
    mergeItems: (previousItems, incomingItems) => dedupeById([...previousItems, ...incomingItems]),
    queryParams: {
      q: query,
      tag: activeTag,
    },
    resetKey: `${locale}::${query}::${activeTag}`,
  });
};
