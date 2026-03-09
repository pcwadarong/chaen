import React, { type ReactNode } from 'react';
import { css, cva, cx } from 'styled-system/css';

import { Link } from '@/i18n/navigation';
import { ArrowUpIcon } from '@/shared/ui/icons/app-icons';
import { MarkdownRenderer } from '@/shared/ui/markdown/markdown-renderer';

export type DetailArchiveLinkItem = {
  description: string | null;
  href: string;
  isActive: boolean;
  title: string;
  yearText: string;
};

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
  sidebarItems: DetailArchiveLinkItem[];
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
  sidebarItems,
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
        <div className={detailPageSidebarViewportClass} data-scroll-region="true">
          {sidebarItems.length > 0 ? (
            <ul className={detailPageSidebarListClass}>
              {sidebarItems.map(item => (
                <li key={item.href}>
                  <Link
                    aria-current={item.isActive ? 'page' : undefined}
                    className={detailPageSidebarLinkClass({ active: item.isActive })}
                    href={item.href}
                  >
                    <div className={detailPageSidebarMetaRowClass}>
                      <span>{item.yearText}</span>
                    </div>
                    <strong className={detailPageSidebarTitleClass}>{item.title}</strong>
                    {item.description ? (
                      <p className={detailPageSidebarDescriptionClass}>{item.description}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={detailPageEmptyArchiveClass}>{emptyArchiveText}</p>
          )}
        </div>
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
    borderRight: '[1px solid rgb(var(--color-border) / 0.18)]',
    background: '[rgb(var(--color-surface) / 0.16)]',
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

const detailPageSidebarListClass = css({
  display: 'grid',
});

const detailPageSidebarLinkClass = cva({
  base: {
    display: 'grid',
    gap: '2',
    px: '4',
    py: '4',
    borderLeft: '[3px solid transparent]',
    borderBottom: '[1px solid rgb(var(--color-border) / 0.16)]',
    color: 'text',
    transition: '[background-color 160ms ease, border-color 160ms ease]',
    _hover: {
      background: '[rgb(var(--color-surface-muted) / 0.5)]',
    },
    _focusVisible: {
      outline: 'none',
      background: '[rgb(var(--color-surface-muted) / 0.58)]',
      boxShadow: '[inset 0 0 0 2px rgb(var(--color-primary) / 0.16)]',
    },
    '@media (min-width: 1200px)': {
      px: '5',
      py: '5',
    },
  },
  variants: {
    active: {
      true: {
        borderLeftColor: 'primary',
        background: '[rgb(var(--color-surface-strong) / 0.3)]',
      },
    },
  },
});

const detailPageSidebarMetaRowClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: 'muted',
  fontSize: '12',
});

const detailPageSidebarTitleClass = css({
  lineClamp: '2',
  fontSize: '20',
  lineHeight: '120',
  letterSpacing: '[-0.03em]',
  color: 'muted',
});

const detailPageSidebarDescriptionClass = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: 'muted',
  fontSize: '14',
});

const detailPageEmptyArchiveClass = css({
  p: '5',
  color: 'muted',
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
  borderBottom: '[1px solid rgb(var(--color-border) / 0.24)]',
  '@media (min-width: 961px)': {
    pb: '12',
  },
});

const detailPageHeroTextClass = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  alignItems: 'center',
  textAlign: 'center',
  mb: '8',
  px: '4',
});

const detailPageTitleClass = css({
  fontSize: '32',
  fontWeight: '[800]',
  lineHeight: '110',
  letterSpacing: '[-0.04em]',
  wordBreak: 'keep-all',
});

const detailPageDescriptionClass = css({
  color: 'muted',
  fontSize: '16',
  lineHeight: '160',
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
  outline: 'none',
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
  borderRadius: 'pill',
  background: 'primary',
  color: 'primaryContrast',
  fontSize: '14',
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
