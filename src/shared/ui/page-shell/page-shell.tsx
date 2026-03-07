import React, { type ReactNode } from 'react';

import styles from '@/shared/ui/page-shell/page-shell.module.css';

type PageShellWidth = 'compact' | 'default';

type PageShellProps = {
  children: ReactNode;
  hideAppFrameFooter?: boolean;
  width?: PageShellWidth;
};

type PageHeaderProps = {
  action?: ReactNode;
  children?: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  title: ReactNode;
};

type PageSectionProps = {
  children: ReactNode;
  title?: ReactNode;
  titleId?: string;
};

/**
 * 페이지 전반의 가로 폭과 세로 리듬을 맞추는 공통 셸입니다.
 */
export const PageShell = ({
  children,
  hideAppFrameFooter = false,
  width = 'default',
}: PageShellProps) => (
  <main
    data-hide-app-frame-footer={hideAppFrameFooter ? 'true' : undefined}
    className={`${styles.shell} ${width === 'compact' ? styles.compactWidth : styles.defaultWidth}`}
  >
    {children}
  </main>
);

/**
 * 페이지 상단 헤더를 같은 비례로 정리합니다.
 * 제목과 액션은 한 줄 플렉스에 두고, 보조 설명과 추가 메타는 아래로 쌓습니다.
 */
export const PageHeader = ({ action, children, description, meta, title }: PageHeaderProps) => (
  <header className={styles.header}>
    {meta ? <div className={styles.meta}>{meta}</div> : null}
    <div className={styles.headlineRow}>
      <h1 className={styles.title}>{title}</h1>
      {action ? <div className={styles.actionWrap}>{action}</div> : null}
    </div>
    {description ? <p className={styles.description}>{description}</p> : null}
    {children}
  </header>
);

/**
 * 본문 블록을 동일한 카드 표면과 `h2` 타이포그래피로 감쌉니다.
 */
export const PageSection = ({ children, title, titleId }: PageSectionProps) => (
  <section aria-labelledby={titleId} className={styles.section}>
    {title ? (
      <h2 id={titleId} className={styles.sectionTitle}>
        {title}
      </h2>
    ) : null}
    {children}
  </section>
);
