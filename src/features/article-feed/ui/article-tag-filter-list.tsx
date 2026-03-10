'use client';

import React from 'react';
import { css, cx } from 'styled-system/css';

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
  <section aria-labelledby="article-tag-filter-title" className={sectionClass}>
    <h2 className={titleClass} id="article-tag-filter-title">
      {title}
    </h2>
    {items.length > 0 ? (
      <div className={listClass}>
        {items.map(item => {
          const isActive = item.tag === activeTag;

          return (
            <Link
              aria-current={isActive ? 'page' : undefined}
              className={cx(tagLinkClass, isActive ? activeTagLinkClass : undefined)}
              href={createTagHref(item.tag, activeTag)}
              key={item.tag}
            >
              <span>{item.label}</span>
              <span className={countClass}>({item.article_count})</span>
            </Link>
          );
        })}
      </div>
    ) : (
      <p className={emptyClass}>{emptyText}</p>
    )}
  </section>
);

const sectionClass = css({
  display: 'grid',
  gap: '3',
});

const titleClass = css({
  fontSize: 'md',
  letterSpacing: '[-0.02em]',
});

const listClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  rowGap: '1',
  columnGap: '2',
});

const tagLinkClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '[0.2rem]',
  minHeight: '[1.75rem]',
  p: '0',
  color: 'muted',
  fontSize: 'sm',
  lineHeight: 'snug',
  textDecoration: 'none',
  transition: '[color 160ms ease, opacity 160ms ease, box-shadow 160ms ease]',
  _hover: {
    color: 'primary',
  },
  _focusVisible: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
  },
});

const activeTagLinkClass = css({
  color: 'primary',
});

const countClass = css({
  color: 'muted',
  fontSize: '[0.6875rem]',
  letterSpacing: '[-0.01em]',
});

const emptyClass = css({
  color: 'muted',
  fontSize: 'sm',
});
