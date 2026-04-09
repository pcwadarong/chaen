'use client';

import { type RefObject, useEffect } from 'react';

const DETAIL_ARCHIVE_AUTO_LOAD_THRESHOLD = 0.25;

type UseDetailArchiveAutoLoadOptions = Readonly<{
  errorMessage: string | null;
  isAutoLoadEnabled: boolean;
  loadMore: () => Promise<void>;
  sentinelRef: RefObject<HTMLDivElement | null>;
  viewportRef: RefObject<HTMLDivElement | null>;
}>;

/**
 * 상세 아카이브 sidebar viewport 안에서 sentinel 교차를 감시해 추가 로드를 붙입니다.
 * auto-load gate가 열려 있고 에러가 없는 경우에만 `loadMore`를 호출해 첫 진입 과호출을 막습니다.
 */
export const useDetailArchiveAutoLoad = ({
  errorMessage,
  isAutoLoadEnabled,
  loadMore,
  sentinelRef,
  viewportRef,
}: UseDetailArchiveAutoLoadOptions) => {
  useEffect(() => {
    if (!sentinelRef.current || !viewportRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        const target = entries[0];
        if (!target?.isIntersecting || errorMessage || !isAutoLoadEnabled) return;
        void loadMore();
      },
      {
        root: viewportRef.current,
        threshold: DETAIL_ARCHIVE_AUTO_LOAD_THRESHOLD,
      },
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [errorMessage, isAutoLoadEnabled, loadMore, sentinelRef, viewportRef]);
};
