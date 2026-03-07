'use client';

import { css } from '@emotion/react';
import React, { type ReactNode } from 'react';

import { Link } from '@/i18n/navigation';
import { getButtonStyle } from '@/shared/ui/button/button';
import { ArrowUpIcon } from '@/shared/ui/icons/app-icons';

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
export const DetailPageShell = ({
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
}: DetailPageShellProps) => (
  <main css={pageStyle}>
    <aside aria-label={sidebarLabel} css={sidebarStyle}>
      <div css={sidebarViewportStyle} data-scroll-region="true">
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
    <article css={contentStyle} data-scroll-region="true">
      <header css={heroStyle}>
        <div css={heroTextStyle}>
          <h1 css={titleStyle}>{title}</h1>
          <p css={descriptionStyle}>{heroDescription}</p>
        </div>
        {tagContent ? <div css={tagWrapStyle}>{tagContent}</div> : null}
      </header>
      <div css={metaBarSectionStyle}>{metaBar}</div>
      <div css={bodyStyle}>
        <section css={contentSectionStyle}>
          {typeof content !== 'undefined' ? (
            content ? (
              <div css={plainContentStyle}>{content}</div>
            ) : (
              <p css={emptyTextStyle}>{emptyContentText}</p>
            )
          ) : (
            children
          )}
        </section>
        <div css={guestbookCtaWrapStyle}>
          <Link href="/guest" css={guestbookCtaStyle}>
            <span>{guestbookCtaText}</span>
            <span aria-hidden css={guestbookCtaIconMotionStyle}>
              <ArrowUpIcon color="current" css={guestbookCtaIconStyle} size="sm" />
            </span>
          </Link>
        </div>
      </div>
    </article>
  </main>
);

const pageStyle = css`
  display: block;

  @media (min-width: 961px) {
    display: grid;
    grid-template-columns: minmax(16rem, 20rem) minmax(0, 1fr);
    gap: 0;
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }
`;

const sidebarStyle = css`
  display: none;

  @media (min-width: 961px) {
    display: flex;
    min-height: 0;
    height: 100%;
    border-right: 1px solid rgb(var(--color-border) / 0.18);
    background: rgb(var(--color-surface) / 0.16);
  }
`;

const sidebarViewportStyle = css`
  padding: var(--space-7) 0;

  @media (min-width: 961px) {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  @media (min-width: 1200px) {
    padding: var(--space-8) 0;
  }
`;

const sidebarListStyle = css`
  display: grid;
`;

const sidebarLinkStyle = css`
  display: grid;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-4) var(--space-4) calc(var(--space-4) + 3px);
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

  @media (min-width: 1200px) {
    padding: var(--space-5) var(--space-5) var(--space-5) calc(var(--space-5) + 3px);
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
  font-size: var(--font-size-12);
`;

const sidebarTitleStyle = css`
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: var(--font-size-20);
  line-height: var(--line-height-120);
  letter-spacing: -0.03em;

  @media (min-width: 1200px) {
    font-size: var(--font-size-20);
  }
`;

const sidebarDescriptionStyle = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgb(var(--color-muted));
  font-size: var(--font-size-14);

  @media (min-width: 1200px) {
    font-size: var(--font-size-14);
  }
`;

const emptyArchiveStyle = css`
  padding: var(--space-5);
  color: rgb(var(--color-muted));
`;

const contentStyle = css`
  display: flex;
  flex-direction: column;
  padding: var(--space-10) var(--space-0) var(--space-24);

  @media (min-width: 961px) {
    min-width: 0;
    min-height: 0;
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding-bottom: 0;
  }
`;

const heroStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: var(--space-10);
  border-bottom: 1px solid rgb(var(--color-border) / 0.24);

  @media (min-width: 961px) {
    padding-bottom: var(--space-12);
  }
`;

const heroTextStyle = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: center;
  text-align: center;
  margin-bottom: var(--space-8);
  padding: 0 var(--space-4);
`;

const titleStyle = css`
  font-size: var(--font-size-32);
  font-weight: 800;
  line-height: var(--line-height-110);
  letter-spacing: -0.04em;
  word-break: keep-all;
`;

const descriptionStyle = css`
  color: rgb(var(--color-muted));
  font-size: var(--font-size-16);
  line-height: var(--line-height-160);
  word-break: keep-all;
`;

const tagWrapStyle = css`
  display: flex;
  justify-content: center;
`;

const metaBarSectionStyle = css`
  width: 100%;
  padding: var(--space-6) 0 var(--space-10);

  @media (min-width: 961px) {
    padding: var(--space-7) 0 var(--space-12);
  }
`;

const bodyStyle = css`
  width: 100%;
  max-width: 48rem;
  margin: 0 auto;
  padding: 0 var(--space-4) var(--space-24);

  @media (min-width: 961px) {
    padding-bottom: var(--space-24);
  }
`;

const contentSectionStyle = css`
  display: grid;
  gap: var(--space-4);

  @media (min-width: 961px) {
    gap: var(--space-5);
  }
`;

const guestbookCtaWrapStyle = css`
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-8);
`;

const guestbookCtaIconStyle = css`
  transform: rotate(90deg);
`;

const guestbookCtaIconMotionStyle = css`
  display: inline-flex;
  transition: transform 180ms ease;
  transform: translateX(var(--arrow-move, 0));
`;

const guestbookCtaStyle = css`
  ${getButtonStyle({
    size: 'sm',
    tone: 'primary',
    variant: 'solid',
  })};
  min-height: 2.25rem;
  gap: var(--space-1);
  padding-inline: var(--space-3);

  &:hover,
  &:focus-visible {
    --arrow-move: 2px;
  }
`;

const emptyTextStyle = css`
  color: rgb(var(--color-muted));
`;

const plainContentStyle = css`
  white-space: pre-wrap;
  line-height: 1.8;
  font-size: var(--font-size-16);
  color: rgb(var(--color-text) / 0.92);
  letter-spacing: -0.01em;

  @media (min-width: 961px) {
    font-size: var(--font-size-17);
  }
`;
