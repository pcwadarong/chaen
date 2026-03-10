import React from 'react';
import { css, cx } from 'styled-system/css';

import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

type RouteLoadingSkeletonProps = {
  loadingText: string;
};

type DetailPageLoadingSkeletonProps = RouteLoadingSkeletonProps;

/**
 * 페이지 로딩에서 재사용하는 기본 스켈레톤 블록입니다.
 */
const SkeletonBlock = ({ className }: { className?: string }) => (
  <div aria-hidden className={cx(skeletonBlockClass, className)} />
);

/**
 * 상세 페이지 레이아웃과 같은 그리드 구조를 사용하는 로딩 스켈레톤입니다.
 * 데스크톱에서는 좌측 아카이브 컬럼을 함께 렌더링하고, 모바일에서는 본문만 꽉 채웁니다.
 */
export const DetailPageLoadingSkeleton = ({ loadingText }: DetailPageLoadingSkeletonProps) => (
  <main
    aria-busy="true"
    className={detailShellClass}
    data-page-scroll-mode="independent"
    role="status"
  >
    <span className={srOnlyClass}>{loadingText}</span>
    <aside className={detailSidebarClass}>
      <div className={detailSidebarViewportClass}>
        {Array.from({ length: 7 }).map((_, index) => (
          <div className={detailSidebarItemClass} key={index}>
            <SkeletonBlock className={css({ width: '12', height: '3' })} />
            <SkeletonBlock className={css({ width: '[72%]', height: '7' })} />
            <SkeletonBlock className={css({ width: 'full', height: '4' })} />
          </div>
        ))}
      </div>
    </aside>
    <section className={detailContentClass}>
      <div className={detailHeroClass}>
        <SkeletonBlock className={css({ width: '[min(30rem, 78%)]', height: '10' })} />
        <SkeletonBlock className={css({ width: '[min(36rem, 88%)]', height: '5' })} />
        <div className={detailTagsClass}>
          <SkeletonBlock className={tagPillClass} />
          <SkeletonBlock className={tagPillClass} />
          <SkeletonBlock className={tagPillClass} />
        </div>
      </div>
      <div className={detailMetaWrapClass}>
        <SkeletonBlock className={detailMetaClass} />
      </div>
      <div className={detailBodyClass}>
        <SkeletonBlock className={css({ width: '[42%]', height: '6' })} />
        <SkeletonBlock className={codeBlockClass} />
        <SkeletonBlock className={imageBlockTallClass} />
        <SkeletonBlock className={css({ width: '[54%]', height: '5' })} />
        <SkeletonBlock className={imageBlockMediumClass} />
      </div>
    </section>
  </main>
);

/**
 * 기록 목록 페이지 레이아웃을 닮은 로딩 스켈레톤입니다.
 */
export const ArticlesPageLoadingSkeleton = ({ loadingText }: RouteLoadingSkeletonProps) => (
  <main aria-busy="true" className={pageShellClass} role="status">
    <span className={srOnlyClass}>{loadingText}</span>
    <div className={headerSkeletonClass}>
      <SkeletonBlock className={css({ width: '28', height: '10' })} />
      <SkeletonBlock className={css({ width: '[min(30rem, 78%)]', height: '5' })} />
    </div>
    <section className={pageSectionClass}>
      <div className={articlesLayoutClass}>
        <div className={articlesFeedColumnClass}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div className={articleListItemSkeletonClass} key={index}>
              <div className={articleTextColumnClass}>
                <SkeletonBlock className={css({ width: '[72%]', height: '7' })} />
                <SkeletonBlock className={css({ width: '[84%]', height: '5' })} />
                <SkeletonBlock className={css({ width: '16', height: '4' })} />
              </div>
              <SkeletonBlock className={articleThumbClass} />
            </div>
          ))}
        </div>
        <aside className={articlesSidebarClass}>
          <SkeletonBlock className={searchFieldClass} />
          <SkeletonBlock className={css({ width: '16', height: '6' })} />
          <div className={tagsWrapClass}>
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonBlock className={smallTagPillClass} key={index} />
            ))}
          </div>
        </aside>
      </div>
    </section>
  </main>
);

/**
 * 프로젝트 목록 페이지 레이아웃을 닮은 로딩 스켈레톤입니다.
 */
export const ProjectPageLoadingSkeleton = ({ loadingText }: RouteLoadingSkeletonProps) => (
  <main aria-busy="true" className={pageShellClass} role="status">
    <span className={srOnlyClass}>{loadingText}</span>
    <div className={headerSkeletonClass}>
      <div className={headerHeadlineRowClass}>
        <div className={headerTextStackClass}>
          <SkeletonBlock className={css({ width: '[18rem]', height: '10' })} />
          <SkeletonBlock className={css({ width: '[min(30rem, 78%)]', height: '5' })} />
        </div>
        <SkeletonBlock className={headerActionClass} />
      </div>
    </div>
    <section className={pageSectionClass}>
      <div className={projectGridClass}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div className={projectCardClass} key={index}>
            <SkeletonBlock className={projectImageClass} />
            <div className={projectCardBodyClass}>
              <SkeletonBlock className={css({ width: '12', height: '4' })} />
              <SkeletonBlock className={css({ width: '[68%]', height: '7' })} />
              <SkeletonBlock className={css({ width: '[54%]', height: '5' })} />
            </div>
          </div>
        ))}
      </div>
    </section>
  </main>
);

/**
 * 이력 페이지 레이아웃을 닮은 로딩 스켈레톤입니다.
 */
export const ResumePageLoadingSkeleton = ({ loadingText }: RouteLoadingSkeletonProps) => (
  <main aria-busy="true" className={resumeShellClass} role="status">
    <span className={srOnlyClass}>{loadingText}</span>
    <div className={headerSkeletonClass}>
      <div className={headerHeadlineRowClass}>
        <div className={headerTextStackClass}>
          <SkeletonBlock className={css({ width: '[18rem]', height: '10' })} />
          <SkeletonBlock className={css({ width: '[min(16rem, 64%)]', height: '5' })} />
        </div>
        <SkeletonBlock className={headerActionClass} />
      </div>
    </div>
    <section className={pageSectionClass}>
      <div className={resumeBodyClass}>
        <SkeletonBlock className={css({ width: '[42%]', height: '5' })} />
        <SkeletonBlock className={css({ width: '[58%]', height: '5' })} />
        <SkeletonBlock className={css({ width: '[36%]', height: '5' })} />
      </div>
    </section>
  </main>
);

const skeletonBlockClass = css({
  borderRadius: 'md',
  background:
    '[linear-gradient(90deg, rgba(148,163,184,0.10) 0%, rgba(148,163,184,0.22) 48%, rgba(148,163,184,0.10) 100%)]',
  backgroundSize: '[200% 100%]',
  animation: '[route-skeleton-shimmer 1.4s ease-in-out infinite]',
});

const pageShellClass = css({
  width: '[min(980px, 100%)]',
  mx: 'auto',
  px: '4',
  pt: '12',
  pb: '20',
  display: 'grid',
  gap: '5',
});

const resumeShellClass = css({
  width: '[min(820px, 100%)]',
  mx: 'auto',
  px: '4',
  pt: '12',
  pb: '20',
  display: 'grid',
  gap: '5',
});

const headerSkeletonClass = css({
  display: 'grid',
  gap: '4',
  pb: '7',
});

const headerHeadlineRowClass = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '4',
  flexWrap: 'wrap',
});

const headerTextStackClass = css({
  display: 'grid',
  gap: '4',
});

const headerActionClass = css({
  width: '[7.5rem]',
  height: '[3.25rem]',
  borderRadius: 'full',
});

const pageSectionClass = css({
  display: 'grid',
  gap: '4',
});

const articlesLayoutClass = css({
  display: 'grid',
  gap: '6',
  '@media (min-width: 961px)': {
    gridTemplateColumns: 'minmax(0, 1fr) 18rem',
    alignItems: 'start',
  },
});

const articlesFeedColumnClass = css({
  display: 'grid',
  borderBottom: '[1px solid var(--colors-border)]',
});

const articleListItemSkeletonClass = css({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '5',
  py: '7',
  borderTop: '[1px solid var(--colors-border)]',
  _first: {
    borderTop: 'none',
  },
});

const articleTextColumnClass = css({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: '4',
  flex: '[1 1 auto]',
  minWidth: '0',
  minHeight: '[8.75rem]',
});

const articleThumbClass = css({
  display: 'none',
  '@media (min-width: 480px)': {
    display: 'block',
    width: '[8.75rem]',
    minWidth: '[8.75rem]',
    aspectRatio: 'square',
    borderRadius: 'sm',
  },
});

const articlesSidebarClass = css({
  display: 'grid',
  gap: '4',
  '@media (max-width: 960px)': {
    display: 'none',
  },
});

const searchFieldClass = css({
  width: 'full',
  height: '[3.5rem]',
  borderRadius: 'lg',
});

const tagsWrapClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

const smallTagPillClass = css({
  width: '[5.5rem]',
  height: '[2rem]',
  borderRadius: 'full',
});

const projectGridClass = css({
  display: 'grid',
  gap: '6',
  '@media (min-width: 961px)': {
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
});

const projectCardClass = css({
  display: 'grid',
  overflow: 'hidden',
  borderRadius: '2xl',
  border: '[1px solid var(--colors-border)]',
});

const projectImageClass = css({
  aspectRatio: '[4 / 2.15]',
});

const projectCardBodyClass = css({
  display: 'grid',
  gap: '4',
  p: '5',
});

const resumeBodyClass = css({
  display: 'grid',
  gap: '4',
});

const detailShellClass = css({
  display: 'block',
  '@media (min-width: 961px)': {
    display: 'grid',
    gridTemplateColumns: '[minmax(16rem, 20rem) minmax(0, 1fr)]',
    height: 'full',
    minHeight: '0',
    overflow: 'hidden',
  },
});

const detailSidebarClass = css({
  display: 'none',
  '@media (min-width: 961px)': {
    display: 'flex',
    minHeight: '0',
    height: 'full',
    borderRight: '[1px solid var(--colors-border)]',
  },
});

const detailSidebarViewportClass = css({
  display: 'grid',
  gap: '0',
  width: 'full',
  minHeight: '0',
  overflowY: 'hidden',
});

const detailSidebarItemClass = css({
  display: 'grid',
  gap: '4',
  px: '6',
  py: '6',
  borderBottom: '[1px solid var(--colors-border)]',
});

const detailContentClass = css({
  display: 'grid',
  gap: '0',
  pt: '10',
  pb: '24',
  '@media (min-width: 961px)': {
    height: 'full',
    minHeight: '0',
    overflowY: 'hidden',
    pb: '0',
  },
});

const detailHeroClass = css({
  display: 'grid',
  justifyItems: 'center',
  gap: '5',
  pb: '10',
  px: '4',
  borderBottom: '[1px solid var(--colors-border)]',
  '@media (min-width: 961px)': {
    pb: '8',
  },
});

const detailTagsClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '2',
});

const tagPillClass = css({
  width: '[6.5rem]',
  height: '[2.25rem]',
  borderRadius: 'full',
});

const detailMetaWrapClass = css({
  display: 'flex',
  justifyContent: 'center',
  pt: '6',
  pb: '10',
});

const detailMetaClass = css({
  width: '[min(33rem, calc(100% - 3rem))]',
  height: '[4.5rem]',
  borderRadius: 'full',
});

const detailBodyClass = css({
  display: 'grid',
  gap: '6',
  width: 'full',
  maxWidth: '[48rem]',
  mx: 'auto',
  px: '4',
  pb: '24',
});

const codeBlockClass = css({
  width: 'full',
  height: '[14rem]',
  borderRadius: '2xl',
});

const imageBlockTallClass = css({
  width: 'full',
  height: '[24rem]',
  borderRadius: '2xl',
  '@media (min-width: 961px)': {
    height: '[34rem]',
  },
});

const imageBlockMediumClass = css({
  width: 'full',
  height: '[16rem]',
  borderRadius: '2xl',
  '@media (min-width: 961px)': {
    height: '[22rem]',
  },
});
