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

type ArticleTagLinkItem = {
  articleCount: number;
  href: string;
  isActive: boolean;
  label: string;
  tag: string;
};

const createTagHref = (tag: string, activeTag: string) => {
  if (tag === activeTag) return '/articles';

  return `/articles?tag=${encodeURIComponent(tag)}`;
};

/**
 * 태그 필터 렌더링에 필요한 파생 링크 모델만 미리 계산합니다.
 */
const buildTagLinkItems = (
  items: LocalizedArticleTagStat[],
  activeTag: string,
): ArticleTagLinkItem[] =>
  items.map(item => ({
    articleCount: item.article_count,
    href: createTagHref(item.tag, activeTag),
    isActive: item.tag === activeTag,
    label: item.label,
    tag: item.tag,
  }));

/**
 * 아티클 목록 우측 패널에서 사용하는 인기 태그 필터 목록입니다.
 *
 * 태그는 URL 기반 필터이므로 버튼이 아니라 링크로 렌더링합니다.
 */
const ArticleTagFilterListBase = ({
  activeTag,
  emptyText,
  items,
  title,
}: ArticleTagFilterListProps) => {
  const linkItems = React.useMemo(() => buildTagLinkItems(items, activeTag), [activeTag, items]);

  return (
    <section aria-labelledby="article-tag-filter-title" className={sectionClass}>
      <h2 className={titleClass} id="article-tag-filter-title">
        {title}
      </h2>
      {linkItems.length > 0 ? (
        <div className={listClass}>
          {linkItems.map(item => (
            <Link
              aria-current={item.isActive ? 'page' : undefined}
              className={cx(tagLinkClass, item.isActive ? activeTagLinkClass : undefined)}
              href={item.href}
              key={item.tag}
            >
              <span>{item.label}</span>
              <span className={countClass}>({item.articleCount})</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className={emptyClass}>{emptyText}</p>
      )}
    </section>
  );
};

ArticleTagFilterListBase.displayName = 'ArticleTagFilterList';

export const ArticleTagFilterList = React.memo(ArticleTagFilterListBase);

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
