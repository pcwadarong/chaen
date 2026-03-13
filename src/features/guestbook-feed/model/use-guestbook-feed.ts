'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { GuestbookEntry, GuestbookThreadItem } from '@/entities/guestbook/model/types';
import { getGuestbookThreadsPage } from '@/features/guestbook-feed/api/guestbook-actions';
import { getErrorMessage } from '@/shared/lib/error/get-error-message';

type UseGuestbookFeedOptions = {
  initialCursor?: string | null;
  initialItems?: GuestbookThreadItem[];
  limit?: number;
  locale: string;
};

type UseGuestbookFeedResult = {
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
const GUESTBOOK_THREADS_LOAD_ERROR_CODE = 'guestbookFeed.loadFailed';

/**
 * 방명록 스레드 목록을 클라이언트에서 무한스크롤 방식으로 관리합니다.
 */
export const useGuestbookFeed = ({
  initialCursor = null,
  initialItems = [],
  limit = DEFAULT_LIMIT,
  locale,
}: UseGuestbookFeedOptions): UseGuestbookFeedResult => {
  const [items, setItems] = useState<GuestbookThreadItem[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [isInitialLoading, setIsInitialLoading] = useState(initialItems.length === 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const setNormalizedError = useCallback((error: unknown) => {
    setErrorMessage(getErrorMessage(error));
  }, []);

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

      const result = await getGuestbookThreadsPage({
        cursor,
        limit,
        locale,
      });

      if (!result.ok || !result.data) {
        throw new Error(
          result.errorCode ?? result.errorMessage ?? GUESTBOOK_THREADS_LOAD_ERROR_CODE,
        );
      }

      mergeUniqueById(result.data.items);
      setNextCursor(result.data.nextCursor);
    },
    [limit, locale, mergeUniqueById],
  );

  const retryInitialLoad = useCallback(async () => {
    setItems([]);
    setNextCursor(null);
    try {
      await requestPage(null, 'initial');
    } catch (error) {
      setNormalizedError(error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [requestPage, setNormalizedError]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore || isInitialLoading) return;

    try {
      await requestPage(nextCursor, 'more');
    } catch (error) {
      setNormalizedError(error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isInitialLoading, isLoadingMore, nextCursor, requestPage, setNormalizedError]);

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
    if (initialItems.length > 0) return;

    const fetchInitial = async () => {
      try {
        await requestPage(null, 'initial');
      } catch (error) {
        setNormalizedError(error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    void fetchInitial();
  }, [initialItems.length, requestPage, setNormalizedError]);

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
