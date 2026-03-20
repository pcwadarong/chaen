'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getErrorMessage } from '@/shared/lib/error/get-error-message';

export type OffsetPaginationFeedQueryParams = Record<string, string | null | undefined>;

export type OffsetPaginationFeedPage<T> = {
  items: T[];
  nextCursor: string | null;
  totalCount?: number | null;
};

type UseOffsetPaginationFeedOptions<T> = {
  initialCursor: string | null;
  initialItems: T[];
  limit?: number;
  loadPage: (params: {
    cursor: string;
    limit: number;
    locale: string;
    queryParams?: OffsetPaginationFeedQueryParams;
  }) => Promise<OffsetPaginationFeedPage<T>>;
  locale: string;
  mergeItems?: (previousItems: T[], incomingItems: T[]) => T[];
  queryParams?: OffsetPaginationFeedQueryParams;
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
 * 무한 스크롤 seed 배열이 새로 생성돼도 원소 참조가 그대로면 같은 값으로 간주합니다.
 */
const areShallowEqualItems = <T>(left: T[], right: T[]) => {
  if (left === right) return true;
  if (left.length !== right.length) return false;

  for (let index = 0; index < left.length; index += 1) {
    if (!Object.is(left[index], right[index])) {
      return false;
    }
  }

  return true;
};

/**
 * offset(cursor) 기반 API를 사용하는 무한 스크롤 리스트 상태를 공통 관리합니다.
 */
export const useOffsetPaginationFeed = <T>({
  initialCursor,
  initialItems,
  limit = DEFAULT_LIMIT,
  loadPage,
  locale,
  mergeItems,
  queryParams,
}: UseOffsetPaginationFeedOptions<T>): UseOffsetPaginationFeedResult<T> => {
  const [items, setItems] = useState<T[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastSeedCursorRef = useRef(initialCursor);
  const lastSeedItemsRef = useRef(initialItems);

  useEffect(() => {
    const isSameSeed =
      Object.is(lastSeedCursorRef.current, initialCursor) &&
      areShallowEqualItems(lastSeedItemsRef.current, initialItems);

    if (isSameSeed) return;

    lastSeedCursorRef.current = initialCursor;
    lastSeedItemsRef.current = initialItems;
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
      const payload = await loadPage({
        cursor: nextCursor,
        limit,
        locale,
        queryParams,
      });

      appendItems(payload.items);
      setNextCursor(payload.nextCursor);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoadingMore(false);
    }
  }, [appendItems, isLoadingMore, limit, loadPage, locale, nextCursor, queryParams]);

  const hasMore = useMemo(() => Boolean(nextCursor), [nextCursor]);

  return {
    errorMessage,
    hasMore,
    isLoadingMore,
    items,
    loadMore,
  };
};
