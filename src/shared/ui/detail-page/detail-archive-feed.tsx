'use client';

import React, { useEffect, useRef } from 'react';
import { css } from 'styled-system/css';

import { useOffsetPaginationFeed } from '@/shared/lib/react/use-offset-pagination-feed';
import { Button } from '@/shared/ui/button/button';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

import { buildDetailArchiveLinkItems } from './build-detail-archive-link-items';
import { DetailArchiveList } from './detail-archive-list';
import type { DetailArchiveRecord } from './detail-archive-types';

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
      className={sidebarViewportClass}
      data-scroll-region="true"
      ref={viewportRef}
    >
      <DetailArchiveList emptyText={emptyText} items={linkItems} />
      <div aria-hidden className={sidebarSentinelClass} ref={sentinelRef} />
      {isLoadingMore ? (
        <p aria-live="polite" className={sidebarStateTextClass}>
          {loadingText}
        </p>
      ) : null}
      {!hasMore && items.length > 0 ? (
        <p aria-live="polite" className={srOnlyClass}>
          {loadMoreEndText}
        </p>
      ) : null}
      {errorMessage ? (
        <div className={sidebarFeedbackPanelClass}>
          <p aria-live="polite" className={sidebarErrorTextClass}>
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

const sidebarViewportClass = css({
  py: '7',
  '@media (min-width: 961px)': {
    flex: '[1 1 auto]',
    minHeight: '0',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
  },
  '@media (min-width: 1200px)': {
    py: '8',
  },
});

const sidebarSentinelClass = css({
  height: '1',
});

const sidebarStateTextClass = css({
  px: '5',
  py: '4',
  color: 'muted',
  fontSize: 'sm',
});

const sidebarFeedbackPanelClass = css({
  display: 'grid',
  justifyItems: 'start',
  gap: '3',
  px: '5',
  py: '4',
});

const sidebarErrorTextClass = css({
  color: 'danger',
  fontSize: 'sm',
});
