import React, { type ReactNode } from 'react';

import { Link } from '@/i18n/navigation';
import styles from '@/shared/ui/detail-page/detail-page-shell.module.css';
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
  children?: ReactNode;
  content?: string | null;
  emptyArchiveText: string;
  emptyContentText?: string;
  guestbookCtaText: string;
  heroDescription: string;
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
  children,
  content,
  emptyArchiveText,
  emptyContentText,
  guestbookCtaText,
  heroDescription,
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
    <main className={styles.page}>
      <aside aria-label={sidebarLabel} className={styles.sidebar}>
        <div className={styles.sidebarViewport} data-scroll-region="true">
          {sidebarItems.length > 0 ? (
            <ul className={styles.sidebarList}>
              {sidebarItems.map(item => (
                <li key={item.href}>
                  <Link
                    aria-current={item.isActive ? 'page' : undefined}
                    className={`${styles.sidebarLink} ${item.isActive ? styles.activeSidebarLink : ''}`}
                    href={item.href}
                  >
                    <div className={styles.sidebarMetaRow}>
                      <span>{item.yearText}</span>
                    </div>
                    <strong className={styles.sidebarTitle}>{item.title}</strong>
                    {item.description ? (
                      <p className={styles.sidebarDescription}>{item.description}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyArchive}>{emptyArchiveText}</p>
          )}
        </div>
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
        </div>
      </article>
    </main>
  );
};
