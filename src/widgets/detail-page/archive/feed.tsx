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
import { useCursorPaginationFeed } from '@/shared/lib/react/use-cursor-pagination-feed';
import { Button } from '@/shared/ui/button/button';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';
import {
  type DetailArchiveLinkItem,
  DetailArchiveList,
  detailArchiveSidebarViewportClass,
} from '@/widgets/detail-page/archive/list';
import {
  type DetailArchivePage,
  type DetailArchiveRecord,
  mergeDetailArchiveFeedItems,
} from '@/widgets/detail-page/archive/model/detail-archive-feed';
import { useDetailArchiveBootstrapPage } from '@/widgets/detail-page/archive/model/use-detail-archive-bootstrap-page';
import { DetailArchiveSidebarSkeleton } from '@/widgets/detail-page/ui/detail-page-section-skeletons';

type DetailArchiveFeedProps<TItem extends DetailArchiveRecord> = {
  activeItemViewportOffsetRatio?: number | null;
  currentItem?: TItem | null;
  emptyText: string;
  hrefBasePath: string;
  initialPage?: DetailArchivePage<TItem> | null;
  loadErrorText: string;
  loadPageAction: (input: {
    cursor?: string | null;
    limit: number;
    locale: string;
  }) => Promise<ActionResult<DetailArchivePage<TItem>>>;
  loadMoreEndText: string;
  loadingText: string;
  locale: string;
  pinCurrentItemToTop?: boolean;
  retryText: string;
  selectedPathSegment: string;
};

const DETAIL_ARCHIVE_LOAD_ERROR_CODE = 'detailArchive.loadFailed';
const EMPTY_DETAIL_ARCHIVE_PAGE = {
  items: [],
  nextCursor: null,
} satisfies DetailArchivePage<DetailArchiveRecord>;

/**
 * 상세 페이지 좌측 아카이브 목록에 cursor 기반 추가 로드를 붙입니다.
 */
export const DetailArchiveFeed = <TItem extends DetailArchiveRecord>({
  activeItemViewportOffsetRatio = null,
  currentItem = null,
  emptyText,
  hrefBasePath,
  initialPage = null,
  loadErrorText,
  loadPageAction,
  loadMoreEndText,
  loadingText,
  locale,
  pinCurrentItemToTop = true,
  retryText,
  selectedPathSegment,
}: DetailArchiveFeedProps<TItem>) => {
  const alignedSelectedPathSegmentRef = useRef<string | null>(null);
  const { bootstrapError, bootstrapPage, isBootstrapping, retryBootstrap } =
    useDetailArchiveBootstrapPage({
      currentItem,
      initialPage,
      loadPageAction,
      locale,
      pinCurrentItemToTop,
    });
  const resolvedInitialPage =
    bootstrapPage ?? (EMPTY_DETAIL_ARCHIVE_PAGE as DetailArchivePage<TItem>);
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

  const { errorMessage, hasMore, isLoadingMore, items, loadMore } = useCursorPaginationFeed<TItem>({
    initialCursor: resolvedInitialPage.nextCursor,
    initialItems: resolvedInitialPage.items,
    loadPage,
    locale,
    mergeItems: mergeDetailArchiveFeedItems,
  });
  const isAutoLoadEnabled = useAutoLoadAfterScroll();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeItemViewportOffsetRatio === null) return;

    alignedSelectedPathSegmentRef.current = null;
  }, [activeItemViewportOffsetRatio, selectedPathSegment]);

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

  useEffect(() => {
    if (activeItemViewportOffsetRatio === null || isBootstrapping || bootstrapError) return;
    if (alignedSelectedPathSegmentRef.current === selectedPathSegment) return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    const frameId = window.requestAnimationFrame(() => {
      const activeItem = viewport.querySelector<HTMLElement>('a[aria-current="page"]');
      if (!activeItem) return;

      alignActiveArchiveItemInViewport(viewport, activeItem, activeItemViewportOffsetRatio);
      alignedSelectedPathSegmentRef.current = selectedPathSegment;
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [activeItemViewportOffsetRatio, bootstrapError, isBootstrapping, selectedPathSegment]);

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

  if (isBootstrapping) {
    return <DetailArchiveSidebarSkeleton />;
  }

  if (bootstrapError) {
    return (
      <div
        className={detailArchiveSidebarViewportClass}
        data-scroll-region="true"
        ref={viewportRef}
      >
        <div className={sidebarFeedbackPanelClass}>
          <p aria-live="polite" className={sidebarErrorTextClass}>
            {loadErrorText}
          </p>
          <Button onClick={retryBootstrap} tone="white" variant="ghost">
            {retryText}
          </Button>
        </div>
      </div>
    );
  }

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

/**
 * 활성 아카이브 항목이 viewport 안에서 원하는 높이에 오도록 초기 스크롤을 맞춥니다.
 */
const alignActiveArchiveItemInViewport = (
  viewport: HTMLElement,
  activeItem: HTMLElement,
  activeItemViewportOffsetRatio: number,
) => {
  const clampedOffsetRatio = Math.min(1, Math.max(0, activeItemViewportOffsetRatio));
  const activeItemCenter = activeItem.offsetTop + activeItem.clientHeight / 2;
  const preferredTop = viewport.clientHeight * clampedOffsetRatio;
  const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
  const nextScrollTop = Math.min(maxScrollTop, Math.max(0, activeItemCenter - preferredTop));

  viewport.scrollTo({
    behavior: 'auto',
    top: nextScrollTop,
  });
};

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
