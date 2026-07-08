'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { css } from 'styled-system/css';

import type { AppLocale } from '@/i18n/routing';
import type { ActionResult } from '@/shared/lib/action/action-result';
import {
  resolvePublicContentPathSegment,
  resolvePublicContentPublishedAt,
} from '@/shared/lib/content/public-content';
import { formatYear } from '@/shared/lib/date/format-year';
import { getErrorMessage } from '@/shared/lib/error/get-error-message';
import { detailArchive, type DetailArchiveDomain } from '@/shared/lib/query/query-keys';
import { useAutoLoadAfterScroll } from '@/shared/lib/react/use-auto-load-after-scroll';
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
import { useDetailArchiveAutoLoad } from '@/widgets/detail-page/archive/model/use-detail-archive-auto-load';
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
const DETAIL_ARCHIVE_PAGE_LIMIT = 10;
const EMPTY_DETAIL_ARCHIVE_PAGE = {
  items: [],
  nextCursor: null,
} satisfies DetailArchivePage<DetailArchiveRecord>;

/**
 * 부트스트랩이 아직 끝나지 않았을 때 쿼리 키에 사용하는 시드 토큰입니다.
 *
 * 부트스트랩 중에는 시드가 빈 페이지이므로, 실제 시드가 준비되면 키가 반드시
 * 갈라지도록 별도 토큰을 사용합니다. 이렇게 하지 않으면 단일 페이지 아카이브에서
 * 빈 시드의 `initialData`가 그대로 캐시에 남아 목록이 비어 보일 수 있습니다.
 */
const DETAIL_ARCHIVE_BOOTSTRAPPING_SEED_KEY = '__bootstrapping__';

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
  // 서로 다른 상세 페이지가 같은 커서 시드(예: 마지막 윈도우의 'root')를 공유해도
  // 이전 페이지의 캐시가 재사용되지 않도록 현재 아이템 식별자를 시드에 포함합니다.
  const seedKey = `${selectedPathSegment}:${
    isBootstrapping
      ? DETAIL_ARCHIVE_BOOTSTRAPPING_SEED_KEY
      : (resolvedInitialPage.nextCursor ?? 'root')
  }`;
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    enabled: !isBootstrapping && !bootstrapError,
    getNextPageParam: lastPage => lastPage.nextCursor,
    initialData: {
      pageParams: [null],
      pages: [
        {
          items: resolvedInitialPage.items,
          nextCursor: resolvedInitialPage.nextCursor,
        },
      ],
    },
    initialPageParam: resolvedInitialPage.nextCursor,
    queryFn: async ({ pageParam }) => {
      const result = await loadPageAction({
        cursor: pageParam,
        limit: DETAIL_ARCHIVE_PAGE_LIMIT,
        locale,
      });

      if (!result.ok || !result.data) {
        throw new Error(result.errorCode ?? result.errorMessage ?? DETAIL_ARCHIVE_LOAD_ERROR_CODE);
      }

      return {
        items: result.data.items,
        nextCursor: result.data.nextCursor,
      };
    },
    queryKey: detailArchive.feed(
      resolveDetailArchiveDomain(hrefBasePath),
      locale as AppLocale,
      seedKey,
    ),
    staleTime: Infinity,
  });

  const items = useMemo(
    () =>
      (data?.pages ?? []).reduce<TItem[]>(
        (mergedItems, page) => mergeDetailArchiveFeedItems(mergedItems, page.items),
        [],
      ),
    [data],
  );
  const errorMessage = error ? getErrorMessage(error) : null;
  const isLoadingMore = isFetchingNextPage;
  const hasMore = hasNextPage;
  const loadMore = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return;

    await fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const isAutoLoadEnabled = useAutoLoadAfterScroll();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useDetailArchiveAutoLoad({
    errorMessage,
    isAutoLoadEnabled,
    loadMore,
    sentinelRef,
    viewportRef,
  });

  useEffect(() => {
    if (activeItemViewportOffsetRatio === null) return;

    alignedSelectedPathSegmentRef.current = null;
  }, [activeItemViewportOffsetRatio, selectedPathSegment]);

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

/**
 * 아카이브가 렌더되는 화면(글/프로젝트 상세)을 쿼리 키 도메인 값으로 변환합니다.
 *
 * 두 상세 화면의 아카이브 캐시가 서로 섞이지 않도록 `hrefBasePath`를 기준으로
 * 도메인을 구분합니다. `/articles`로 시작하면 글 아카이브, 그 외에는 프로젝트
 * 아카이브로 취급합니다.
 *
 * @param hrefBasePath 아카이브 링크의 기준 경로입니다.
 * @returns 쿼리 키에 사용할 아카이브 도메인 값입니다.
 */
const resolveDetailArchiveDomain = (hrefBasePath: string): DetailArchiveDomain =>
  hrefBasePath.startsWith('/articles') ? 'article' : 'project';

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
