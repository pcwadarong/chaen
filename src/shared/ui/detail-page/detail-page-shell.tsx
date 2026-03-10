import React, { type ReactNode } from 'react';
import { css, cx } from 'styled-system/css';

import { Link } from '@/i18n/navigation';
import {
  type DetailArchiveLinkItem,
  DetailArchiveList,
  detailArchiveSidebarViewportClass,
} from '@/shared/ui/detail-page/archive/list';
import { ArrowUpIcon } from '@/shared/ui/icons/app-icons';
import { MarkdownRenderer } from '@/shared/ui/markdown/markdown-renderer';

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

type DetailPageSidebarProps = {
  content?: ReactNode;
  emptyArchiveText: string;
  items: DetailArchiveLinkItem[];
  label: string;
};

type DetailPageHeroProps = {
  description: string;
  tagContent?: ReactNode;
  title: string;
};

type DetailPageBodyProps = {
  bottomContent?: ReactNode;
  contentNode: ReactNode;
  guestbookCtaText: string;
};

type DetailPageGuestbookCtaProps = {
  text: string;
};

/**
 * 디테일 페이지 좌측 아카이브 사이드바를 렌더링합니다.
 */
const DetailPageSidebar = ({ content, emptyArchiveText, items, label }: DetailPageSidebarProps) => (
  <aside aria-label={label} className={detailPageSidebarClass}>
    {content ?? (
      <div className={detailArchiveSidebarViewportClass} data-scroll-region="true">
        <DetailArchiveList emptyText={emptyArchiveText} items={items} />
      </div>
    )}
  </aside>
);

/**
 * 디테일 페이지 hero 영역을 렌더링합니다.
 */
const DetailPageHero = ({ description, tagContent, title }: DetailPageHeroProps) => (
  <header className={detailPageHeroClass}>
    <div className={detailPageHeroTextClass}>
      <h1 className={detailPageTitleClass}>{title}</h1>
      <p className={detailPageDescriptionClass}>{description}</p>
    </div>
    {tagContent ? <div className={detailPageTagWrapClass}>{tagContent}</div> : null}
  </header>
);

/**
 * 방명록 CTA를 렌더링합니다.
 */
const DetailPageGuestbookCta = ({ text }: DetailPageGuestbookCtaProps) => (
  <div className={detailPageGuestbookCtaWrapClass}>
    <Link className={cx(detailPageGuestbookCtaClass, 'group')} href="/guest">
      <span>{text}</span>
      <span aria-hidden className={detailPageGuestbookCtaIconMotionClass}>
        <ArrowUpIcon className={detailPageGuestbookCtaIconClass} color="current" size="sm" />
      </span>
    </Link>
  </div>
);

/**
 * 디테일 페이지 본문, CTA, 하단 섹션을 묶어 렌더링합니다.
 */
const DetailPageBody = ({ bottomContent, contentNode, guestbookCtaText }: DetailPageBodyProps) => (
  <div className={detailPageBodyClass}>
    <section className={detailPageContentSectionClass}>{contentNode}</section>
    <DetailPageGuestbookCta text={guestbookCtaText} />
    {bottomContent ? (
      <section className={detailPageBottomSectionClass}>{bottomContent}</section>
    ) : null}
  </div>
);

/**
 * 좌측 아카이브 목록과 우측 상세 본문을 함께 배치하는 공용 디테일 셸입니다.
 */
export const DetailPageShell = ({
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
      <DetailPageSidebar
        content={sidebarContent}
        emptyArchiveText={emptyArchiveText}
        items={sidebarItems}
        label={sidebarLabel}
      />
      <article
        className={detailPageContentClass}
        data-primary-scroll-region="true"
        data-scroll-region="true"
      >
        <DetailPageHero description={heroDescription} tagContent={tagContent} title={title} />
        <div className={detailPageMetaBarSectionClass}>{metaBar}</div>
        <DetailPageBody
          bottomContent={bottomContent}
          contentNode={contentNode}
          guestbookCtaText={guestbookCtaText}
        />
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
