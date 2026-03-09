import React from 'react';

import { Link } from '@/i18n/navigation';

import type { DetailArchiveLinkItem } from './detail-archive-types';

import styles from './detail-page-shell.module.css';

type DetailArchiveListProps = {
  emptyText: string;
  items: DetailArchiveLinkItem[];
};

/**
 * 상세 페이지 좌측 아카이브 링크 목록을 공통 마크업으로 렌더링합니다.
 */
export const DetailArchiveList = ({ emptyText, items }: DetailArchiveListProps) => {
  if (items.length === 0) {
    return <p className={styles.emptyArchive}>{emptyText}</p>;
  }

  return (
    <ul className={styles.sidebarList}>
      {items.map(item => (
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
  );
};
