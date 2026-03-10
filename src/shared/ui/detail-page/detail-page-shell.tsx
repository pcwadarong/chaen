import React, { type ReactNode } from 'react';
import { css, cx } from 'styled-system/css';

import { Link } from '@/i18n/navigation';
import { ArrowUpIcon } from '@/shared/ui/icons/app-icons';
import { MarkdownRenderer } from '@/shared/ui/markdown/markdown-renderer';

import { DetailArchiveList } from './detail-archive-list';
import type { DetailArchiveLinkItem } from './detail-archive-types';

type DetailPageShellProps = {
  bottomContent?: ReactNode;
  children?: ReactNode;
  content?: string | null;
  emptyArchiveText: string;
  emptyContentText?: string;
  guestbookCtaText: string;
  heroDescription: string;
  hideAppFrameFooter?: boolean;
  metaBar: ReactNode;
  sidebarContent?: ReactNode;
  sidebarItems?: DetailArchiveLinkItem[];
  sidebarLabel: string;
  tagContent?: ReactNode;
  title: string;
};

/**
 * 좌측 아카이브 목록과 우측 상세 본문을 함께 배치하는 공용 디테일 셸입니다.
 */
export const DetailPageShell = async ({
  bottomContent,
  children,
  content,
  emptyArchiveText,
  emptyContentText,
  guestbookCtaText,
  heroDescription,
  hideAppFrameFooter = false,
  metaBar,
  sidebarContent,
  sidebarItems = [],
  sidebarLabel,
  tagContent,
  title,
}: DetailPageShellProps) => {
  const contentNode =
    typeof content !== 'undefined' ? (
      <MarkdownRenderer emptyText={emptyContentText} markdown={content} />
    ) : (
      children
    );

  return (
    <main
      className={detailPageShellClass}
      data-hide-app-frame-footer={hideAppFrameFooter ? 'true' : undefined}
      data-page-scroll-mode="independent"
    >
      <aside aria-label={sidebarLabel} className={detailPageSidebarClass}>
        {sidebarContent ?? (
          <div className={detailPageSidebarViewportClass} data-scroll-region="true">
            <DetailArchiveList emptyText={emptyArchiveText} items={sidebarItems} />
          </div>
        )}
      </aside>
      <article className={detailPageContentClass} data-scroll-region="true">
        <header className={detailPageHeroClass}>
          <div className={detailPageHeroTextClass}>
            <h1 className={detailPageTitleClass}>{title}</h1>
            <p className={detailPageDescriptionClass}>{heroDescription}</p>
          </div>
          {tagContent ? <div className={detailPageTagWrapClass}>{tagContent}</div> : null}
        </header>
        <div className={detailPageMetaBarSectionClass}>{metaBar}</div>
        <div className={detailPageBodyClass}>
          <section className={detailPageContentSectionClass}>{contentNode}</section>
          <div className={detailPageGuestbookCtaWrapClass}>
            <Link className={cx(detailPageGuestbookCtaClass, 'group')} href="/guest">
              <span>{guestbookCtaText}</span>
              <span aria-hidden className={detailPageGuestbookCtaIconMotionClass}>
                <ArrowUpIcon
                  className={detailPageGuestbookCtaIconClass}
                  color="current"
                  size="sm"
                />
              </span>
            </Link>
          </div>
          {bottomContent ? (
            <section className={detailPageBottomSectionClass}>{bottomContent}</section>
          ) : null}
        </div>
      </article>
    </main>
  );
};

const detailPageShellClass = css({
  display: 'block',
  '@media (min-width: 961px)': {
    display: 'grid',
    gridTemplateColumns: '[minmax(16rem, 20rem) minmax(0, 1fr)]',
    gap: '0',
    flex: '[1 1 auto]',
    minHeight: '0',
    height: 'full',
    overflow: 'hidden',
  },
});

const detailPageSidebarClass = css({
  display: 'none',
  '@media (min-width: 961px)': {
    display: 'flex',
    minHeight: '0',
    height: 'full',
    borderRight: '[1px solid var(--colors-border)]',
    background: 'surfaceMuted',
  },
});

const detailPageSidebarViewportClass = css({
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

const detailPageContentClass = css({
  display: 'flex',
  flexDirection: 'column',
  pt: '10',
  pb: '24',
  '@media (min-width: 961px)': {
    minWidth: '0',
    minHeight: '0',
    height: 'full',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    pb: '0',
  },
});

const detailPageHeroClass = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  pb: '10',
  borderBottom: '[1px solid var(--colors-border)]',
  '@media (min-width: 961px)': {
    pb: '8',
  },
});

const detailPageHeroTextClass = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  alignItems: 'center',
  textAlign: 'center',
  mb: '4',
  px: '4',
});

const detailPageTitleClass = css({
  fontSize: '32',
  fontWeight: '[800]',
  lineHeight: 'tight',
  letterSpacing: '[-0.04em]',
  wordBreak: 'keep-all',
});

const detailPageDescriptionClass = css({
  color: 'muted',
  fontSize: 'md',
  lineHeight: 'relaxed',
  wordBreak: 'keep-all',
});

const detailPageTagWrapClass = css({
  display: 'flex',
  justifyContent: 'center',
});

const detailPageMetaBarSectionClass = css({
  width: 'full',
  pt: '6',
  pb: '10',
  '@media (min-width: 961px)': {
    pt: '7',
    pb: '12',
  },
});

const detailPageBodyClass = css({
  width: 'full',
  maxWidth: '[48rem]',
  mx: 'auto',
  px: '4',
  pb: '24',
});

const detailPageContentSectionClass = css({
  display: 'grid',
  gap: '4',
  '@media (min-width: 961px)': {
    gap: '5',
  },
});

const detailPageGuestbookCtaWrapClass = css({
  display: 'flex',
  justifyContent: 'flex-end',
  mt: '8',
});

const detailPageGuestbookCtaClass = css({
  appearance: 'none',
  border: '[1px solid transparent]',
  textDecoration: 'none',
  userSelect: 'none',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1',
  minHeight: '[2.25rem]',
  px: '3',
  py: '1',
  borderRadius: 'full',
  background: 'primary',
  color: 'primaryContrast',
  fontSize: 'sm',
  letterSpacing: '[-0.01em]',
});

const detailPageGuestbookCtaIconMotionClass = css({
  display: 'inline-flex',
  transition: 'transform',
  '.group:hover &': {
    transform: 'translateY(-2px)',
  },
});

const detailPageGuestbookCtaIconClass = css({
  transform: '[rotate(45deg)]',
});

const detailPageBottomSectionClass = css({
  mt: '10',
  '@media (min-width: 961px)': {
    mt: '12',
  },
});
