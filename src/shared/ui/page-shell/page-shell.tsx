'use client';

import { css } from '@emotion/react';
import React from 'react';

type PageShellWidth = 'compact' | 'default';

type PageShellProps = {
  children: React.ReactNode;
  width?: PageShellWidth;
};

type PageHeaderProps = {
  action?: React.ReactNode;
  children?: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  title: React.ReactNode;
};

type PageSectionProps = {
  children: React.ReactNode;
  title?: React.ReactNode;
  titleId?: string;
};

/**
 * 페이지 전반의 가로 폭과 세로 리듬을 맞추는 공통 셸입니다.
 */
export const PageShell = ({ children, width = 'default' }: PageShellProps) => (
  <main css={[shellStyle, width === 'compact' ? compactWidthStyle : defaultWidthStyle]}>
    {children}
  </main>
);

/**
 * 페이지 상단 헤더를 같은 비례로 정리합니다.
 * 제목과 액션은 한 줄 플렉스에 두고, 보조 설명과 추가 메타는 아래로 쌓습니다.
 */
export const PageHeader = ({ action, children, description, meta, title }: PageHeaderProps) => (
  <header css={headerStyle}>
    {meta ? <div css={metaStyle}>{meta}</div> : null}
    <div css={headlineRowStyle}>
      <h1 css={titleStyle}>{title}</h1>
      {action ? <div css={actionWrapStyle}>{action}</div> : null}
    </div>
    {description ? <p css={descriptionStyle}>{description}</p> : null}
    {children}
  </header>
);

/**
 * 본문 블록을 동일한 카드 표면과 `h2` 타이포그래피로 감쌉니다.
 */
export const PageSection = ({ children, title, titleId }: PageSectionProps) => (
  <section aria-labelledby={titleId} css={sectionStyle}>
    {title ? (
      <h2 id={titleId} css={sectionTitleStyle}>
        {title}
      </h2>
    ) : null}
    {children}
  </section>
);

const shellStyle = css`
  margin: 0 auto;
  padding: var(--space-12) var(--space-4) var(--space-20);
  display: grid;
  gap: var(--space-5);
`;

const defaultWidthStyle = css`
  width: min(1120px, 100%);
`;

const compactWidthStyle = css`
  width: min(960px, 100%);
`;

const headerStyle = css`
  display: grid;
  gap: var(--space-3);
  padding-bottom: var(--space-7);
`;

const metaStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  color: rgb(var(--color-muted));
  font-size: var(--font-size-14);
`;

const headlineRowStyle = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
`;

const titleStyle = css`
  flex: 1 1 18rem;
  font-size: var(--font-size-32);
  line-height: var(--line-height-98);
  letter-spacing: -0.04em;
`;

const actionWrapStyle = css`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
`;

const descriptionStyle = css`
  max-width: 70ch;
  color: rgb(var(--color-muted));
`;

const sectionStyle = css`
  display: grid;
  gap: var(--space-4);
`;

const sectionTitleStyle = css`
  font-size: var(--font-size-20);
  line-height: var(--line-height-120);
  letter-spacing: -0.02em;
`;
