'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  type OffsetPaginationFeedPage,
  type OffsetPaginationFeedQueryParams,
  resolveOffsetPaginationLoadMore,
} from '@/shared/lib/react/offset-pagination-feed-state';

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
 * `areShallowEqualItems`는 무한 스크롤 seed 배열을 얕게 비교합니다.
 *
 * 먼저 배열 참조 동일성(`left === right`)을 확인하고, 다르면 길이를 비교한 뒤,
 * 마지막으로 각 인덱스의 원소를 `Object.is` 기준으로 순서대로 검사합니다.
 *
 * 깊은 비교는 수행하지 않으므로, 중첩 객체나 배열 내부 값만 바뀌고 바깥 원소 참조가
 * 그대로인 경우에는 변경을 감지하지 못합니다.
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
  const itemsRef = useRef(initialItems);

  useEffect(() => {
    const isSameSeed =
      Object.is(lastSeedCursorRef.current, initialCursor) &&
      areShallowEqualItems(lastSeedItemsRef.current, initialItems);

    if (isSameSeed) return;

    lastSeedCursorRef.current = initialCursor;
    lastSeedItemsRef.current = initialItems;
    itemsRef.current = initialItems;
    setItems(initialItems);
    setNextCursor(initialCursor);
    setIsLoadingMore(false);
    setErrorMessage(null);
  }, [initialCursor, initialItems]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    setErrorMessage(null);

    try {
      const resolved = await resolveOffsetPaginationLoadMore({
        currentCursor: nextCursor,
        currentItems: itemsRef.current,
        limit,
        locale,
        loadPage,
        mergeItems,
        queryParams,
      });

      itemsRef.current = resolved.items;
      setItems(resolved.items);
      setNextCursor(resolved.nextCursor);
      setErrorMessage(resolved.errorMessage);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, limit, loadPage, locale, mergeItems, nextCursor, queryParams]);

  const hasMore = useMemo(() => Boolean(nextCursor), [nextCursor]);

  return {
    errorMessage,
    hasMore,
    isLoadingMore,
    items,
    loadMore,
  };
};
