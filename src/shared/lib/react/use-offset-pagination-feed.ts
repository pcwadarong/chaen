'use client';

import { useCallback, useMemo, useState } from 'react';

import { getErrorMessage } from '@/shared/lib/error/get-error-message';
import { requestJsonApiClient } from '@/shared/lib/http/request-json-api-client';

type OffsetFeedResponse<T> = {
  ok: boolean;
  items: T[];
  nextCursor: string | null;
  reason?: string;
};

type UseOffsetPaginationFeedOptions<T> = {
  endpoint: string;
  initialCursor: string | null;
  initialItems: T[];
  limit?: number;
  locale: string;
  mergeItems?: (previousItems: T[], incomingItems: T[]) => T[];
};

type UseOffsetPaginationFeedResult<T> = {
  errorMessage: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  items: T[];
  loadMore: () => Promise<void>;
};

const DEFAULT_LIMIT = 12;

/**
 * offset(cursor) 기반 API를 사용하는 무한 스크롤 리스트 상태를 공통 관리합니다.
 */
export const useOffsetPaginationFeed = <T>({
  endpoint,
  initialCursor,
  initialItems,
  limit = DEFAULT_LIMIT,
  locale,
  mergeItems,
}: UseOffsetPaginationFeedOptions<T>): UseOffsetPaginationFeedResult<T> => {
  const [items, setItems] = useState<T[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const appendItems = useCallback(
    (incomingItems: T[]) => {
      setItems(previousItems => {
        if (!mergeItems) return [...previousItems, ...incomingItems];

        return mergeItems(previousItems, incomingItems);
      });
    },
    [mergeItems],
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    setErrorMessage(null);

    try {
      const url = new URL(endpoint, window.location.origin);
      url.searchParams.set('locale', locale);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('cursor', nextCursor);

      const payload = await requestJsonApiClient<OffsetFeedResponse<T>>({
        fallbackReason: 'failed to fetch list',
        init: {
          cache: 'no-store',
        },
        method: 'GET',
        url: url.toString(),
      });

      appendItems(payload.items);
      setNextCursor(payload.nextCursor);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoadingMore(false);
    }
  }, [appendItems, endpoint, isLoadingMore, limit, locale, nextCursor]);

  const hasMore = useMemo(() => Boolean(nextCursor), [nextCursor]);

  return {
    errorMessage,
    hasMore,
    isLoadingMore,
    items,
    loadMore,
  };
};
