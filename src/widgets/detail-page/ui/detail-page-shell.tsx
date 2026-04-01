import React, { type ReactNode } from 'react';
import { css, cx } from 'styled-system/css';

import { Link } from '@/i18n/navigation';
import { ArrowUpIcon } from '@/shared/ui/icons/app-icons';
import { MarkdownRenderer } from '@/shared/ui/markdown/markdown-renderer';
import {
  type DetailArchiveLinkItem,
  DetailArchiveList,
  detailArchiveSidebarViewportClass,
} from '@/widgets/detail-page/archive/list';

type DetailPageShellProps = {
  bottomContent?: ReactNode;
  children?: ReactNode;
  content?: string | null;
  emptyArchiveText: string;
  emptyContentText?: string;
  guestbookCtaText: string;
  heroDescription: string;
  heroHomeHref?: string;
  heroHomeLabel?: string;
  heroTitleSlot?: ReactNode;
  heroTopSlot?: ReactNode;
  heroTitleAccessory?: ReactNode;
  hideAppFrameFooter?: boolean;
  locale?: string;
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
  homeHref?: string;
  homeLabel?: string;
  titleAccessory?: ReactNode;
  titleSlot?: ReactNode;
  topSlot?: ReactNode;
  locale?: string;
  tagContent?: ReactNode;
  title: string;
};

type DetailPageHeroHomeLinkProps = {
  href: string;
  label: string;
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
 * 모바일 디테일 헤더 좌측에 배치되는 홈 링크를 렌더링합니다.
 */
const DetailPageHeroHomeLink = ({ href, label }: DetailPageHeroHomeLinkProps) => (
  <Link className={detailPageHeroHomeLinkClass} href={href}>
    <ArrowUpIcon aria-hidden="true" className={detailPageHeroHomeLinkIconClass} size="sm" />
    <span>{label}</span>
  </Link>
);

/**
 * 디테일 페이지 hero의 타이틀 행을 렌더링합니다.
 *
 * 모바일에서는 좌측 홈 링크와 우측 동일 너비 플레이스홀더를 함께 배치하고,
 * 데스크톱에서는 기존처럼 중앙 타이틀 정렬만 유지합니다.
 */
const DetailPageHeroTitleRow = ({
  homeHref,
  homeLabel,
  locale,
  title,
  titleAccessory,
}: Pick<DetailPageHeroProps, 'homeHref' | 'homeLabel' | 'locale' | 'title' | 'titleAccessory'>) => {
  const titleNode = (
    <div className={detailPageTitleRowClass}>
      <h1 className={detailPageTitleClass} lang={locale}>
        {title}
      </h1>
      {titleAccessory ? (
        <div className={detailPageTitleAccessoryClass}>{titleAccessory}</div>
      ) : null}
    </div>
  );

  if (!homeHref || !homeLabel) {
    return titleNode;
  }

  return (
    <div className={detailPageHeroTitleGridClass}>
      <div className={detailPageHeroTitleSideClass}>
        <DetailPageHeroHomeLink href={homeHref} label={homeLabel} />
      </div>
      <div className={detailPageHeroTitleCenterClass}>{titleNode}</div>
      <div aria-hidden="true" className={detailPageHeroTitleSideClass}>
        <span className={detailPageHeroHomeLinkPlaceholderClass}>
          <ArrowUpIcon aria-hidden="true" className={detailPageHeroHomeLinkIconClass} size="sm" />
          <span>{homeLabel}</span>
        </span>
      </div>
    </div>
  );
};

/**
 * 디테일 페이지 hero 영역을 렌더링합니다.
 */
const DetailPageHero = ({
  description,
  homeHref,
  homeLabel,
  locale,
  tagContent,
  title,
  titleSlot,
  topSlot,
  titleAccessory,
}: DetailPageHeroProps) => (
  <header className={detailPageHeroClass}>
    <div className={detailPageHeroTextClass}>
      {topSlot ? <div className={detailPageHeroTopSlotClass}>{topSlot}</div> : null}
      {titleSlot ? (
        titleSlot
      ) : (
        <DetailPageHeroTitleRow
          homeHref={homeHref}
          homeLabel={homeLabel}
          locale={locale}
          title={title}
          titleAccessory={titleAccessory}
        />
      )}
      <p className={detailPageDescriptionClass} lang={locale}>
        {description}
      </p>
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
      <span
        aria-hidden
        className={detailPageGuestbookCtaIconMotionClass}
        data-detail-page-guestbook-cta-icon="true"
      >
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
  heroHomeHref,
  heroHomeLabel,
  heroTitleSlot,
  heroTopSlot,
  heroTitleAccessory,
  hideAppFrameFooter = false,
  locale,
  metaBar,
  sidebarContent,
  sidebarItems = [],
  sidebarLabel,
  tagContent,
  title,
}: DetailPageShellProps) => {
  const contentNode =
    typeof content !== 'undefined' ? (
      <MarkdownRenderer emptyText={emptyContentText} locale={locale} markdown={content} />
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
        <DetailPageHero
          description={heroDescription}
          homeHref={heroHomeHref}
          homeLabel={heroHomeLabel}
          locale={locale}
          tagContent={tagContent}
          titleSlot={heroTitleSlot}
          topSlot={heroTopSlot}
          title={title}
          titleAccessory={heroTitleAccessory}
        />
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
  _desktopUp: {
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
  _desktopUp: {
    display: 'flex',
    minHeight: '0',
    height: 'full',
    borderRight: '[1px solid var(--colors-border)]',
  },
});

const detailPageContentClass = css({
  display: 'flex',
  flexDirection: 'column',
  minWidth: '0',
  overflowX: 'hidden',
  pt: '10',
  pb: '24',
  _desktopUp: {
    minWidth: '0',
    minHeight: '0',
    height: 'full',
    overflowY: 'auto',
    overscrollBehaviorY: 'contain',
    pb: '0',
  },
});

const detailPageHeroClass = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  pb: '10',
  borderBottom: '[1px solid var(--colors-border)]',
  _desktopUp: {
    pb: '8',
  },
});

const detailPageHeroTextClass = css({
  display: 'flex',
  flexDirection: 'column',
  width: 'full',
  minWidth: '0',
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
  '&:lang(ja)': {
    wordBreak: 'break-all',
    overflowWrap: 'anywhere',
  },
});

const detailPageTitleRowClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '3',
});

const detailPageTitleAccessoryClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  marginLeft: '1',
});

const detailPageHeroTitleGridClass = css({
  alignSelf: 'stretch',
  width: 'full',
  display: 'grid',
  gridTemplateColumns: '[auto minmax(0,1fr) auto]',
  alignItems: 'start',
  columnGap: '2',
  _desktopUp: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const detailPageHeroTitleSideClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  _desktopUp: {
    display: 'none',
  },
});

const detailPageHeroTitleCenterClass = css({
  display: 'flex',
  justifyContent: 'center',
  minWidth: '0',
  textAlign: 'center',
});

const detailPageHeroHomeLinkClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  minHeight: '[2.75rem]',
  color: 'muted',
  fontSize: 'sm',
  fontWeight: '[600]',
  transition: 'colors',
  _hover: {
    color: 'text',
  },
  _focusVisible: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
    borderRadius: 'md',
  },
});

const detailPageHeroHomeLinkIconClass = css({
  transform: 'rotate(-90deg)',
});

const detailPageHeroHomeLinkPlaceholderClass = css({
  visibility: 'hidden',
  pointerEvents: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  minHeight: '[2.75rem]',
  fontSize: 'sm',
  fontWeight: '[600]',
});

const detailPageDescriptionClass = css({
  color: 'muted',
  fontSize: 'md',
  lineHeight: 'relaxed',
  wordBreak: 'keep-all',
  '&:lang(ja)': {
    wordBreak: 'break-all',
    overflowWrap: 'anywhere',
  },
});

const detailPageHeroTopSlotClass = css({
  width: 'full',
  display: 'flex',
  justifyContent: 'flex-start',
});

const detailPageTagWrapClass = css({
  display: 'flex',
  justifyContent: 'center',
});

const detailPageMetaBarSectionClass = css({
  width: 'full',
  pt: '6',
  pb: '10',
  _desktopUp: {
    pt: '7',
    pb: '12',
  },
});

const detailPageBodyClass = css({
  width: 'full',
  maxWidth: '[48rem]',
  minWidth: '0',
  mx: 'auto',
  px: '4',
  pb: '24',
});

const detailPageContentSectionClass = css({
  display: 'grid',
  minWidth: '0',
  gap: '4',
  _desktopUp: {
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
  '&:hover [data-detail-page-guestbook-cta-icon="true"]': {
    transform: 'translate(2px, -2px)',
  },
});

const detailPageGuestbookCtaIconMotionClass = css({
  display: 'inline-flex',
  transition: '[transform 180ms ease]',
});

const detailPageGuestbookCtaIconClass = css({
  transform: '[rotate(45deg)]',
});

const detailPageBottomSectionClass = css({
  mt: '10',
  _desktopUp: {
    mt: '12',
  },
});
