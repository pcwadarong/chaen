'use client';

import React, { useEffect, useRef } from 'react';

import { useOffsetPaginationFeed } from '@/shared/lib/react/use-offset-pagination-feed';
import { Button } from '@/shared/ui/button/button';
import { srOnlyStyleObject } from '@/shared/ui/styles/sr-only-style';

import { buildDetailArchiveLinkItems } from './build-detail-archive-link-items';
import { DetailArchiveList } from './detail-archive-list';
import type { DetailArchiveRecord } from './detail-archive-types';

import styles from './detail-page-shell.module.css';

type DetailArchivePage<TItem> = {
  items: TItem[];
  nextCursor: string | null;
};

type DetailArchiveFeedProps<TItem extends DetailArchiveRecord> = {
  emptyText: string;
  endpoint: string;
  hrefBasePath: string;
  initialPage: DetailArchivePage<TItem>;
  loadErrorText: string;
  loadMoreEndText: string;
  loadingText: string;
  locale: string;
  retryText: string;
  selectedId: string;
};

/**
 * 상세 페이지 좌측 아카이브 목록에 cursor 기반 추가 로드를 붙입니다.
 */
export const DetailArchiveFeed = <TItem extends DetailArchiveRecord>({
  emptyText,
  endpoint,
  hrefBasePath,
  initialPage,
  loadErrorText,
  loadMoreEndText,
  loadingText,
  locale,
  retryText,
  selectedId,
}: DetailArchiveFeedProps<TItem>) => {
  const { errorMessage, hasMore, isLoadingMore, items, loadMore } = useOffsetPaginationFeed<TItem>({
    endpoint,
    initialCursor: initialPage.nextCursor,
    initialItems: initialPage.items,
    locale,
    mergeItems: (previousItems, incomingItems) => {
      const seenIds = new Set(previousItems.map(item => item.id));

      return [
        ...previousItems,
        ...incomingItems.filter(item => {
          if (seenIds.has(item.id)) return false;
          seenIds.add(item.id);

          return true;
        }),
      ];
    },
  });
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current || !viewportRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        const target = entries[0];
        if (!target?.isIntersecting || errorMessage) return;
        void loadMore();
      },
      {
        root: viewportRef.current,
        threshold: 0.25,
      },
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [errorMessage, loadMore]);

  const linkItems = buildDetailArchiveLinkItems({
    hrefBasePath,
    items,
    locale,
    selectedId,
  });

  return (
    <div
      aria-busy={isLoadingMore ? 'true' : undefined}
      className={styles.sidebarViewport}
      data-scroll-region="true"
      ref={viewportRef}
    >
      <DetailArchiveList emptyText={emptyText} items={linkItems} />
      <div aria-hidden className={styles.sidebarSentinel} ref={sentinelRef} />
      {isLoadingMore ? (
        <p aria-live="polite" className={styles.sidebarStateText}>
          {loadingText}
        </p>
      ) : null}
      {!hasMore && items.length > 0 ? (
        <p aria-live="polite" style={srOnlyStyleObject}>
          {loadMoreEndText}
        </p>
      ) : null}
      {errorMessage ? (
        <div className={styles.sidebarFeedbackPanel}>
          <p aria-live="polite" className={styles.sidebarErrorText}>
            {loadErrorText}
          </p>
          <Button onClick={() => void loadMore()} tone="white" variant="ghost">
            {retryText}
          </Button>
        </div>
      ) : null}
    </div>
  );
};
