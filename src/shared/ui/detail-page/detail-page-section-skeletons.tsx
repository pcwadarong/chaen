import React from 'react';
import { css, cx } from 'styled-system/css';

import { detailArchiveSidebarViewportClass } from '@/shared/ui/detail-page/archive/list';

type DetailSectionSkeletonProps = {
  className?: string;
};

/**
 * 디테일 페이지 보조 섹션에서 재사용하는 스켈레톤 블록입니다.
 */
const SkeletonBlock = ({ className }: DetailSectionSkeletonProps) => (
  <div aria-hidden className={cx(skeletonBlockClass, className)} />
);

/**
 * 좌측 아카이브 사이드바 fallback UI입니다.
 */
export const DetailArchiveSidebarSkeleton = () => (
  <div aria-hidden className={detailArchiveSidebarViewportClass}>
    {Array.from({ length: 7 }).map((_, index) => (
      <div className={archiveItemClass} key={index}>
        <SkeletonBlock className={css({ width: '12', height: '3' })} />
        <SkeletonBlock className={css({ width: '[72%]', height: '7' })} />
        <SkeletonBlock className={css({ width: 'full', height: '4' })} />
      </div>
    ))}
  </div>
);

/**
 * 상세 hero 태그 영역 fallback UI입니다.
 */
export const DetailTagListSkeleton = () => (
  <div aria-hidden className={tagListClass}>
    <SkeletonBlock className={tagPillClass} />
    <SkeletonBlock className={tagPillClass} />
    <SkeletonBlock className={tagPillClass} />
  </div>
);

/**
 * 하단 관련 글 섹션 fallback UI입니다.
 */
export const DetailRelatedArticlesSkeleton = () => (
  <section aria-hidden className={relatedSectionClass}>
    <SkeletonBlock className={css({ width: '28', height: '7' })} />
    <ol className={relatedListClass}>
      {Array.from({ length: 3 }).map((_, index) => (
        <li className={relatedItemClass} key={index}>
          <div className={relatedCardClass}>
            <div className={relatedTextClass}>
              <SkeletonBlock className={css({ width: '[56%]', height: '6' })} />
              <SkeletonBlock className={css({ width: '[82%]', height: '4' })} />
              <SkeletonBlock className={css({ width: '14', height: '4' })} />
            </div>
            <SkeletonBlock className={relatedThumbClass} />
          </div>
        </li>
      ))}
    </ol>
  </section>
);

const skeletonBlockClass = css({
  borderRadius: 'md',
  background:
    '[linear-gradient(90deg, rgba(148,163,184,0.10) 0%, rgba(148,163,184,0.22) 48%, rgba(148,163,184,0.10) 100%)]',
  backgroundSize: '[200% 100%]',
  animation: '[route-skeleton-shimmer 1.4s ease-in-out infinite]',
});

const archiveItemClass = css({
  display: 'grid',
  gap: '4',
  px: '6',
  py: '6',
  borderBottom: '[1px solid var(--colors-border)]',
  _last: {
    borderBottom: 'none',
  },
});

const tagListClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '2',
});

const tagPillClass = css({
  width: '[5.5rem]',
  height: '[2rem]',
  borderRadius: 'full',
});

const relatedSectionClass = css({
  display: 'grid',
  gap: '4',
  mt: '12',
  pt: '8',
  borderTop: '[1px solid var(--colors-border)]',
});

const relatedListClass = css({
  listStyle: 'none',
  m: '0',
  p: '0',
  borderBottom: '[1px solid var(--colors-border)]',
});

const relatedItemClass = css({
  borderTop: '[1px solid var(--colors-border)]',
  _first: {
    borderTop: 'none',
  },
});

const relatedCardClass = css({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '5',
  py: '7',
});

const relatedTextClass = css({
  display: 'grid',
  gap: '3',
  minWidth: '0',
  flex: '1',
});

const relatedThumbClass = css({
  width: '20',
  height: '20',
  borderRadius: 'xl',
  flexShrink: '0',
});
