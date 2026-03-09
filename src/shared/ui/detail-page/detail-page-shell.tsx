import React, { type ReactNode } from 'react';

import { Link } from '@/i18n/navigation';
import styles from '@/shared/ui/detail-page/detail-page-shell.module.css';
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
      className={styles.page}
      data-hide-app-frame-footer={hideAppFrameFooter ? 'true' : undefined}
      data-page-scroll-mode="independent"
    >
      <aside aria-label={sidebarLabel} className={styles.sidebar}>
        {sidebarContent ?? (
          <div className={styles.sidebarViewport} data-scroll-region="true">
            <DetailArchiveList emptyText={emptyArchiveText} items={sidebarItems} />
          </div>
        )}
      </aside>
      <article className={styles.content} data-scroll-region="true">
        <header className={styles.hero}>
          <div className={styles.heroText}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.description}>{heroDescription}</p>
          </div>
          {tagContent ? <div className={styles.tagWrap}>{tagContent}</div> : null}
        </header>
        <div className={styles.metaBarSection}>{metaBar}</div>
        <div className={styles.body}>
          <section className={styles.contentSection}>{contentNode}</section>
          <div className={styles.guestbookCtaWrap}>
            <Link className={styles.guestbookCta} href="/guest">
              <span>{guestbookCtaText}</span>
              <span aria-hidden className={styles.guestbookCtaIconMotion}>
                <ArrowUpIcon className={styles.guestbookCtaIcon} color="current" size="sm" />
              </span>
            </Link>
          </div>
          {bottomContent ? (
            <section className={styles.bottomSection}>{bottomContent}</section>
          ) : null}
        </div>
      </article>
    </main>
  );
};
