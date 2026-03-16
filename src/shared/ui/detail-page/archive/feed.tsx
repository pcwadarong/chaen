'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { css } from 'styled-system/css';

import type { ActionResult } from '@/shared/lib/action/action-result';
import {
  resolvePublicContentPathSegment,
  resolvePublicContentPublishedAt,
} from '@/shared/lib/content/public-content';
import { formatYear } from '@/shared/lib/date/format-year';
import { useAutoLoadAfterScroll } from '@/shared/lib/react/use-auto-load-after-scroll';
import { useOffsetPaginationFeed } from '@/shared/lib/react/use-offset-pagination-feed';
import { Button } from '@/shared/ui/button/button';
import {
  type DetailArchiveLinkItem,
  DetailArchiveList,
  detailArchiveSidebarViewportClass,
} from '@/shared/ui/detail-page/archive/list';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

type DetailArchiveRecord = {
  description: string | null;
  id: string;
  publish_at?: string | null;
  slug?: string | null;
  title: string;
};

type DetailArchivePage<TItem> = {
  items: TItem[];
  nextCursor: string | null;
};

type DetailArchiveFeedProps<TItem extends DetailArchiveRecord> = {
  emptyText: string;
  hrefBasePath: string;
  initialPage: DetailArchivePage<TItem>;
  loadErrorText: string;
  loadPageAction: (input: {
    cursor?: string | null;
    limit: number;
    locale: string;
  }) => Promise<ActionResult<DetailArchivePage<TItem>>>;
  loadMoreEndText: string;
  loadingText: string;
  locale: string;
  retryText: string;
  selectedPathSegment: string;
};

const DETAIL_ARCHIVE_LOAD_ERROR_CODE = 'detailArchive.loadFailed';

/**
 * 상세 페이지 좌측 아카이브 목록에 cursor 기반 추가 로드를 붙입니다.
 */
export const DetailArchiveFeed = <TItem extends DetailArchiveRecord>({
  emptyText,
  hrefBasePath,
  initialPage,
  loadErrorText,
  loadPageAction,
  loadMoreEndText,
  loadingText,
  locale,
  retryText,
  selectedPathSegment,
}: DetailArchiveFeedProps<TItem>) => {
  const loadPage = useCallback(
    async ({
      cursor,
      limit,
      locale: nextLocale,
    }: {
      cursor: string | null;
      limit: number;
      locale: string;
    }) => {
      const result = await loadPageAction({
        cursor,
        limit,
        locale: nextLocale,
      });

      if (!result.ok || !result.data) {
        throw new Error(result.errorCode ?? result.errorMessage ?? DETAIL_ARCHIVE_LOAD_ERROR_CODE);
      }

      return {
        items: result.data.items,
        nextCursor: result.data.nextCursor,
      };
    },
    [loadPageAction],
  );

  const { errorMessage, hasMore, isLoadingMore, items, loadMore } = useOffsetPaginationFeed<TItem>({
    initialCursor: initialPage.nextCursor,
    initialItems: initialPage.items,
    loadPage,
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
  const isAutoLoadEnabled = useAutoLoadAfterScroll();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

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
        threshold: 0.25,
      },
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [errorMessage, isAutoLoadEnabled, loadMore]);

  const linkItems = useMemo(
    () =>
      buildDetailArchiveLinkItems({
        hrefBasePath,
        items,
        locale,
        selectedPathSegment,
      }),
    [hrefBasePath, items, locale, selectedPathSegment],
  );

  return (
    <div
      aria-busy={isLoadingMore ? 'true' : undefined}
      className={detailArchiveSidebarViewportClass}
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

const sidebarSentinelClass = css({
  height: '1',
});

type BuildDetailArchiveLinkItemsInput<TItem extends DetailArchiveRecord> = {
  hrefBasePath: string;
  items: TItem[];
  locale: string;
  selectedPathSegment: string;
};

/**
 * 상세 페이지 좌측 아카이브 목록 데이터를 링크 렌더링용 형태로 변환합니다.
 */
const buildDetailArchiveLinkItems = <TItem extends DetailArchiveRecord>({
  hrefBasePath,
  items,
  locale,
  selectedPathSegment,
}: BuildDetailArchiveLinkItemsInput<TItem>): DetailArchiveLinkItem[] =>
  items.map(item => ({
    description: item.description,
    href: `${hrefBasePath}/${resolvePublicContentPathSegment(item)}`,
    isActive: resolvePublicContentPathSegment(item) === selectedPathSegment,
    title: item.title,
    yearText: formatYear(resolvePublicContentPublishedAt(item), locale) ?? '-',
  }));

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
  color: 'error',
  fontSize: 'sm',
});
