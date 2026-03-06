'use client';

import { css } from '@emotion/react';
import React, { type ReactNode } from 'react';

import { Link } from '@/i18n/navigation';

export type DetailArchiveLinkItem = {
  description: string | null;
  href: string;
  isActive: boolean;
  title: string;
  yearText: string;
};

type DetailPageShellProps = {
  children: ReactNode;
  emptyArchiveText: string;
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
export const DetailPageShell = ({
  children,
  emptyArchiveText,
  heroDescription,
  metaBar,
  sidebarItems,
  sidebarLabel,
  tagContent,
  title,
}: DetailPageShellProps) => (
  <main css={pageStyle}>
    <aside aria-label={sidebarLabel} css={sidebarStyle}>
      <div css={sidebarViewportStyle} data-app-scroll-viewport="true">
        {sidebarItems.length > 0 ? (
          <ul css={sidebarListStyle}>
            {sidebarItems.map(item => (
              <li key={item.href}>
                <Link
                  aria-current={item.isActive ? 'page' : undefined}
                  href={item.href}
                  css={[sidebarLinkStyle, item.isActive && activeSidebarLinkStyle]}
                >
                  <div css={sidebarMetaRowStyle}>
                    <span>{item.yearText}</span>
                  </div>
                  <strong css={sidebarTitleStyle}>{item.title}</strong>
                  {item.description ? (
                    <p css={sidebarDescriptionStyle}>{item.description}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p css={emptyArchiveStyle}>{emptyArchiveText}</p>
        )}
      </div>
    </aside>
    <article css={contentStyle}>
      <header css={heroStyle}>
        <div css={heroTextStyle}>
          <h1 css={titleStyle}>{title}</h1>
          <p css={descriptionStyle}>{heroDescription}</p>
        </div>
        {tagContent ? <div css={tagWrapStyle}>{tagContent}</div> : null}
        {metaBar}
      </header>
      <div css={bodyStyle}>{children}</div>
    </article>
  </main>
);

const pageStyle = css`
  display: block;

  @media (min-width: 961px) {
    display: grid;
    grid-template-columns: minmax(16rem, 20rem) minmax(0, 1fr);
    gap: 0;
    min-height: 100%;
  }
`;

const sidebarStyle = css`
  display: none;

  @media (min-width: 961px) {
    display: block;
    position: sticky;
    top: 0;
    align-self: start;
    min-height: 100dvh;
    border-right: 1px solid rgb(var(--color-border) / 0.18);
    background: rgb(var(--color-surface) / 0.16);
  }
`;

const sidebarViewportStyle = css`
  max-height: 100dvh;
  overflow-y: auto;
  padding: var(--space-8) 0;
`;

const sidebarListStyle = css`
  display: grid;
`;

const sidebarLinkStyle = css`
  display: grid;
  gap: var(--space-2);
  padding: var(--space-5) var(--space-5) var(--space-5) calc(var(--space-5) + 3px);
  border-left: 3px solid transparent;
  border-bottom: 1px solid rgb(var(--color-border) / 0.16);
  color: rgb(var(--color-text));
  transition:
    background-color 160ms ease,
    border-color 160ms ease;

  &:hover {
    background: rgb(var(--color-surface-muted) / 0.5);
  }

  &:focus-visible {
    outline: none;
    background: rgb(var(--color-surface-muted) / 0.58);
    box-shadow: inset 0 0 0 2px rgb(var(--color-primary) / 0.16);
  }
`;

const activeSidebarLinkStyle = css`
  border-left-color: rgb(var(--color-primary));
  background: rgb(var(--color-surface-strong) / 0.3);
`;

const sidebarMetaRowStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgb(var(--color-muted));
  font-size: var(--font-size-14);
`;

const sidebarTitleStyle = css`
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: var(--font-size-24);
  line-height: var(--line-height-120);
  letter-spacing: -0.03em;
`;

const sidebarDescriptionStyle = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgb(var(--color-muted));
`;

const emptyArchiveStyle = css`
  padding: var(--space-5);
  color: rgb(var(--color-muted));
`;

const contentStyle = css`
  display: grid;
  gap: var(--space-12);
  padding: var(--space-10) var(--space-4) var(--space-16);

  @media (min-width: 961px) {
    padding: var(--space-12) var(--space-10) var(--space-20);
  }
`;

const heroStyle = css`
  display: grid;
  gap: var(--space-6);
  padding-top: var(--space-4);
`;

const heroTextStyle = css`
  display: grid;
  gap: var(--space-4);
  justify-items: center;
  text-align: center;
`;

const titleStyle = css`
  font-size: clamp(2.5rem, 6vw, 4.75rem);
  line-height: 0.98;
  letter-spacing: -0.06em;
`;

const descriptionStyle = css`
  max-width: 42rem;
  color: rgb(var(--color-muted));
  font-size: clamp(1rem, 2vw, 1.75rem);
  line-height: var(--line-height-140);
`;

const tagWrapStyle = css`
  display: flex;
  justify-content: center;
`;

const bodyStyle = css`
  width: min(100%, 52rem);
  margin: 0 auto;
`;
