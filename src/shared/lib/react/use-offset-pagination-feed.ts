'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { getErrorMessage } from '@/shared/lib/error/get-error-message';
import { requestJsonApiClient } from '@/shared/lib/http/request-json-api-client';

type OffsetFeedResponse<T> = {
  ok: boolean;
  items: T[];
  nextCursor: string | null;
  reason?: string;
  totalCount?: number | null;
};

type UseOffsetPaginationFeedOptions<T> = {
  endpoint: string;
  initialCursor: string | null;
  initialItems: T[];
  limit?: number;
  locale: string;
  mergeItems?: (previousItems: T[], incomingItems: T[]) => T[];
  queryParams?: Record<string, string | null | undefined>;
};

type UseOffsetPaginationFeedResult<T> = {
  errorMessage: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  items: T[];
  loadMore: () => Promise<void>;
};

const DEFAULT_LIMIT = 10;

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
  queryParams,
}: UseOffsetPaginationFeedOptions<T>): UseOffsetPaginationFeedResult<T> => {
  const [items, setItems] = useState<T[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setNextCursor(initialCursor);
    setIsLoadingMore(false);
    setErrorMessage(null);
  }, [initialCursor, initialItems]);

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
      Object.entries(queryParams ?? {}).forEach(([key, value]) => {
        if (!value) return;
        url.searchParams.set(key, value);
      });

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
  }, [appendItems, endpoint, isLoadingMore, limit, locale, nextCursor, queryParams]);

  const hasMore = useMemo(() => Boolean(nextCursor), [nextCursor]);

  return {
    errorMessage,
    hasMore,
    isLoadingMore,
    items,
    loadMore,
  };
};
