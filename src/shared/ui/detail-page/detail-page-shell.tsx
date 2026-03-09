import React, { type ReactNode } from 'react';
import { cx } from 'styled-system/css';

import { Link } from '@/i18n/navigation';
import {
  detailPageBodyClass,
  detailPageBottomSectionClass,
  detailPageContentClass,
  detailPageContentSectionClass,
  detailPageDescriptionClass,
  detailPageEmptyArchiveClass,
  detailPageGuestbookCtaClass,
  detailPageGuestbookCtaIconClass,
  detailPageGuestbookCtaIconMotionClass,
  detailPageGuestbookCtaWrapClass,
  detailPageHeroClass,
  detailPageHeroTextClass,
  detailPageMetaBarSectionClass,
  detailPageShellClass,
  detailPageSidebarClass,
  detailPageSidebarDescriptionClass,
  detailPageSidebarLinkClass,
  detailPageSidebarListClass,
  detailPageSidebarMetaRowClass,
  detailPageSidebarTitleClass,
  detailPageSidebarViewportClass,
  detailPageTagWrapClass,
  detailPageTitleClass,
} from '@/shared/ui/detail-page/detail-page-shell.styles';
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
