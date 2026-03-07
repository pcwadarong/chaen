'use client';

import { css } from '@emotion/react';
import React from 'react';

import type { LocalizedArticleTagStat } from '@/entities/article/model/types';
import { Link } from '@/i18n/navigation';

type ArticleTagFilterListProps = {
  activeTag: string;
  emptyText: string;
  items: LocalizedArticleTagStat[];
  title: string;
};

const createTagHref = (tag: string, activeTag: string) => {
  if (tag === activeTag) return '/articles';

  return `/articles?tag=${encodeURIComponent(tag)}`;
};

/**
 * 아티클 목록 우측 패널에서 사용하는 인기 태그 필터 목록입니다.
 *
 * 태그는 URL 기반 필터이므로 버튼이 아니라 링크로 렌더링합니다.
 */
export const ArticleTagFilterList = ({
  activeTag,
  emptyText,
  items,
  title,
}: ArticleTagFilterListProps) => (
  <section aria-labelledby="article-tag-filter-title" css={sectionStyle}>
    <h2 css={titleStyle} id="article-tag-filter-title">
      {title}
    </h2>
    {items.length > 0 ? (
      <div css={listStyle}>
        {items.map(item => {
          const isActive = item.tag === activeTag;

          return (
            <Link
              aria-current={isActive ? 'page' : undefined}
              css={[tagLinkStyle, isActive ? activeTagLinkStyle : undefined]}
              href={createTagHref(item.tag, activeTag)}
              key={item.tag}
            >
              <span>{item.label}</span>
              <span css={countStyle}>{item.article_count}</span>
            </Link>
          );
        })}
      </div>
    ) : (
      <p css={emptyStyle}>{emptyText}</p>
    )}
  </section>
);

const sectionStyle = css`
  display: grid;
  gap: var(--space-3);
`;

const titleStyle = css`
  font-size: var(--font-size-16);
  letter-spacing: -0.02em;
`;

const listStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const tagLinkStyle = css`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 2.25rem;
  padding: 0 var(--space-3);
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--color-border) / 0.22);
  background: rgb(var(--color-surface-muted) / 0.36);
  color: rgb(var(--color-text));
  font-size: var(--font-size-14);
  text-decoration: none;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;

  &:hover {
    border-color: rgb(var(--color-border) / 0.38);
    background: rgb(var(--color-surface-muted) / 0.58);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgb(var(--color-primary) / 0.18);
  }
`;

const activeTagLinkStyle = css`
  border-color: rgb(var(--color-primary) / 0.24);
  background: rgb(var(--color-primary) / 0.1);
  color: rgb(var(--color-primary));
`;

const countStyle = css`
  color: rgb(var(--color-muted));
  font-size: var(--font-size-12);
`;

const emptyStyle = css`
  color: rgb(var(--color-muted));
  font-size: var(--font-size-14);
`;
