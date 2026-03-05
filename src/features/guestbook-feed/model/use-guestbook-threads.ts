'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { GuestbookEntry, GuestbookThreadItem } from '@/entities/guestbook/model/types';

type GuestbookThreadsResponse = {
  ok: boolean;
  items: GuestbookThreadItem[];
  nextCursor: string | null;
  reason?: string;
};

type UseGuestbookThreadsOptions = {
  limit?: number;
};

type UseGuestbookThreadsResult = {
  applyServerThread: (entry: GuestbookThreadItem) => void;
  applyServerThreadEntry: (entry: GuestbookThreadItem | GuestbookEntryLike) => void;
  errorMessage: string | null;
  hasMore: boolean;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  items: GuestbookThreadItem[];
  loadMore: () => Promise<void>;
  removeThreadById: (id: string) => void;
  prependLocalThread: (entry: GuestbookThreadItem) => void;
  retryInitialLoad: () => Promise<void>;
  updateThreadById: (
    id: string,
    updater: (entry: GuestbookThreadItem) => GuestbookThreadItem,
  ) => void;
};

const DEFAULT_LIMIT = 12;
type GuestbookEntryLike = GuestbookEntry;

/**
 * 방명록 스레드 목록을 클라이언트에서 무한스크롤 방식으로 관리합니다.
 */
export const useGuestbookThreads = ({
  limit = DEFAULT_LIMIT,
}: UseGuestbookThreadsOptions = {}): UseGuestbookThreadsResult => {
  const [items, setItems] = useState<GuestbookThreadItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mergeUniqueById = useCallback(
    (incoming: GuestbookThreadItem[]) =>
      setItems(previous => {
        const map = new Map(previous.map(item => [item.id, item]));
        incoming.forEach(item => map.set(item.id, item));
        return Array.from(map.values()).sort(
          (left, right) => +new Date(right.created_at) - +new Date(left.created_at),
        );
      }),
    [],
  );

  const requestPage = useCallback(
    async (cursor: string | null, loadingMode: 'initial' | 'more') => {
      if (loadingMode === 'initial') setIsInitialLoading(true);
      if (loadingMode === 'more') setIsLoadingMore(true);
      setErrorMessage(null);

      const url = new URL('/api/guestbook/threads', window.location.origin);
      url.searchParams.set('limit', String(limit));
      if (cursor) url.searchParams.set('cursor', cursor);

      const response = await fetch(url.toString(), {
        method: 'GET',
        cache: 'no-store',
      });

      const payload = (await response.json()) as GuestbookThreadsResponse;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.reason ?? 'failed to fetch guestbook threads');
      }

      mergeUniqueById(payload.items);
      setNextCursor(payload.nextCursor);
    },
    [limit, mergeUniqueById],
  );

  const retryInitialLoad = useCallback(async () => {
    setItems([]);
    setNextCursor(null);
    try {
      await requestPage(null, 'initial');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      setErrorMessage(message);
    } finally {
      setIsInitialLoading(false);
    }
  }, [requestPage]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore || isInitialLoading) return;

    try {
      await requestPage(nextCursor, 'more');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      setErrorMessage(message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isInitialLoading, isLoadingMore, nextCursor, requestPage]);

  const prependLocalThread = useCallback((entry: GuestbookThreadItem) => {
    setItems(previous => [entry, ...previous]);
  }, []);

  const applyServerThread = useCallback((entry: GuestbookThreadItem) => {
    setItems(previous => {
      const withoutTarget = previous.filter(item => item.id !== entry.id);
      return [entry, ...withoutTarget].sort(
        (left, right) => +new Date(right.created_at) - +new Date(left.created_at),
      );
    });
  }, []);

  const applyServerThreadEntry = useCallback(
    (entry: GuestbookThreadItem | GuestbookEntryLike) => {
      if ('replies' in entry) {
        applyServerThread(entry);
        return;
      }

      setItems(previous =>
        previous.map(item =>
          item.id === entry.id ? { ...item, ...entry, replies: item.replies } : item,
        ),
      );
    },
    [applyServerThread],
  );

  const updateThreadById = useCallback(
    (id: string, updater: (entry: GuestbookThreadItem) => GuestbookThreadItem) => {
      setItems(previous => previous.map(entry => (entry.id === id ? updater(entry) : entry)));
    },
    [],
  );

  const removeThreadById = useCallback((id: string) => {
    setItems(previous => previous.filter(entry => entry.id !== id));
  }, []);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        await requestPage(null, 'initial');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown error';
        setErrorMessage(message);
      } finally {
        setIsInitialLoading(false);
      }
    };

    void fetchInitial();
  }, [requestPage]);

  const hasMore = useMemo(() => Boolean(nextCursor), [nextCursor]);

  return {
    errorMessage,
    hasMore,
    isInitialLoading,
    isLoadingMore,
    items,
    loadMore,
    applyServerThread,
    applyServerThreadEntry,
    removeThreadById,
    prependLocalThread,
    retryInitialLoad,
    updateThreadById,
  };
};
