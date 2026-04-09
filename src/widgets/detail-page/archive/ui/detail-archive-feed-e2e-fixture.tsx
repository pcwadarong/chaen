'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { css } from 'styled-system/css';

import {
  type ActionResult,
  createActionFailure,
  createActionSuccess,
} from '@/shared/lib/action/action-result';
import { DetailArchiveFeed } from '@/widgets/detail-page/archive/feed';

type FixtureArchiveItem = {
  description: string | null;
  id: string;
  publish_at: string;
  slug: string;
  title: string;
};

type FixtureArchivePage = {
  items: FixtureArchiveItem[];
  nextCursor: string | null;
};

const FIXTURE_ARCHIVE_PAGES: Record<string, FixtureArchivePage> = {
  initial: {
    items: Array.from({ length: 8 }, (_, index) => ({
      description: `아카이브 설명 ${index + 1}`,
      id: `archive-item-${index + 1}`,
      publish_at: `2026-03-${String(20 - index).padStart(2, '0')}T00:00:00.000Z`,
      slug: `archive-item-${index + 1}`,
      title: `아카이브 항목 ${index + 1}`,
    })),
    nextCursor: 'page-2',
  },
  'page-2': {
    items: Array.from({ length: 2 }, (_, index) => ({
      description: `추가 아카이브 설명 ${index + 9}`,
      id: `archive-item-${index + 9}`,
      publish_at: `2026-03-${String(12 - index).padStart(2, '0')}T00:00:00.000Z`,
      slug: `archive-item-${index + 9}`,
      title: `아카이브 항목 ${index + 9}`,
    })),
    nextCursor: null,
  },
};

/**
 * DetailArchiveFeed의 브라우저 상호작용을 고정 데이터로 검증하는 fixture입니다.
 */
export const DetailArchiveFeedE2eFixture = () => {
  const [loadCount, setLoadCount] = useState(0);
  const initialPage = useMemo(() => FIXTURE_ARCHIVE_PAGES.initial, []);

  /**
   * cursor에 대응하는 fixture 페이지를 비동기로 반환합니다.
   */
  const loadPageAction = useCallback(
    async ({
      cursor,
    }: {
      cursor?: string | null;
      limit: number;
      locale: string;
    }): Promise<ActionResult<FixtureArchivePage>> => {
      setLoadCount(previous => previous + 1);

      const resolvedCursor = cursor ?? 'initial';
      const page = FIXTURE_ARCHIVE_PAGES[resolvedCursor];

      await new Promise(resolve => {
        window.setTimeout(resolve, 80);
      });

      if (!page) {
        return createActionFailure('fixture archive page missing', 'fixture.archivePageMissing');
      }

      return createActionSuccess(page);
    },
    [],
  );

  return (
    <main className={pageClass}>
      <section className={panelClass}>
        <h1 className={titleClass}>DetailArchiveFeed Browser Fixture</h1>
        <p className={metaClass} data-testid="archive-load-count">
          loadCount:{loadCount}
        </p>
        <p className={metaClass}>
          auto-load는 keydown 이후 viewport 하단 sentinel에서만 발생해야 한다.
        </p>
        <div className={archiveViewportFrameClass}>
          <DetailArchiveFeed<FixtureArchiveItem>
            activeItemViewportOffsetRatio={null}
            currentItem={null}
            emptyText="비어 있음"
            hrefBasePath="/articles"
            initialPage={initialPage}
            loadErrorText="불러오기 실패"
            loadMoreEndText="끝"
            loadingText="불러오는 중"
            loadPageAction={loadPageAction}
            locale="ko"
            pinCurrentItemToTop={false}
            retryText="다시 시도"
            selectedPathSegment="archive-item-1"
          />
        </div>
      </section>
    </main>
  );
};

const pageClass = css({
  minHeight: 'dvh',
  display: 'grid',
  placeItems: 'center',
  px: '6',
  py: '10',
  background:
    '[linear-gradient(180deg, color-mix(in srgb, #5d5bff 12%, white) 0%, color-mix(in srgb, #5d5bff 5%, white) 100%)]',
});

const panelClass = css({
  width: 'full',
  maxWidth: '[28rem]',
  display: 'grid',
  gap: '3',
  p: '4',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderColor: 'border',
  background: 'surface',
  boxShadow: 'lg',
});

const titleClass = css({
  fontSize: 'xl',
  fontWeight: 'semibold',
  color: 'text',
});

const metaClass = css({
  fontSize: 'sm',
  color: 'muted',
});

const archiveViewportFrameClass = css({
  '& [data-scroll-region="true"]': {
    height: '[15rem]',
    borderRadius: 'xl',
    borderWidth: '1px',
    borderColor: 'border',
    background: 'surface',
  },
});
