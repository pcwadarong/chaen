'use client';

import { useCallback } from 'react';

import type { ArticleListItem } from '@/entities/article/model/types';
import { getArticlesPageAction } from '@/features/browse-articles/api/get-articles-page';
import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import { useOffsetPaginationFeed } from '@/shared/lib/react/use-offset-pagination-feed';

type UseBrowseArticlesOptions = {
  activeTag: string;
  initialCursor: string | null;
  initialItems: ArticleListItem[];
  locale: string;
  query: string;
};

const ARTICLE_FEED_LOAD_ERROR_CODE = 'articleFeed.loadFailed';

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
      const result = await getArticlesPageAction({
        cursor,
        limit,
        locale: nextLocale,
        query: queryParams?.q,
        tag: queryParams?.tag,
      });

      if (!result.ok || !result.data) {
        throw new Error(result.errorCode ?? result.errorMessage ?? ARTICLE_FEED_LOAD_ERROR_CODE);
      }

      return {
        items: result.data.items,
        nextCursor: result.data.nextCursor,
        totalCount: result.data.totalCount,
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
