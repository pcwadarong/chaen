'use client';

import type { ArticleListItem } from '@/entities/article/model/types';
import { dedupeById } from '@/shared/lib/array/dedupe-by-id';
import { useOffsetPaginationFeed } from '@/shared/lib/react/use-offset-pagination-feed';

type UseArticleFeedOptions = {
  initialCursor: string | null;
  initialItems: ArticleListItem[];
  locale: string;
  query: string;
};

/**
 * 아티클 목록 무한 스크롤 상태를 관리합니다.
 */
export const useArticleFeed = ({
  initialCursor,
  initialItems,
  locale,
  query,
}: UseArticleFeedOptions) =>
  useOffsetPaginationFeed<ArticleListItem>({
    endpoint: '/api/articles',
    initialCursor,
    initialItems,
    locale,
    mergeItems: (previousItems, incomingItems) => dedupeById([...previousItems, ...incomingItems]),
    queryParams: {
      q: query,
    },
  });
