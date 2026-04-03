'use client';

import React from 'react';
import { css, cx } from 'styled-system/css';

import { Link } from '@/i18n/navigation';

export type ArticleTagFilterItem = {
  articleCount?: number | null;
  label: string;
  tag: string;
};

type ArticleTagHrefMode = 'query' | 'tag-page';

type ArticleTagFilterListProps = {
  activeTag: string;
  defaultLabel: string;
  emptyText: string;
  hrefMode?: ArticleTagHrefMode;
  items: readonly ArticleTagFilterItem[];
  itemDivider?: 'dot' | 'none';
  loadingText?: string;
  onNavigationStart?: (nextState: { nextTag: string }) => void;
  pending?: boolean;
  title: string;
};

type ArticleTagLinkItem = {
  articleCount: number | null;
  href: string;
  isActive: boolean;
  key: string;
  label: string;
  tag: string;
};

const createTagHref = (tag: string, hrefMode: ArticleTagHrefMode) => {
  if (!tag) return '/articles';
  if (hrefMode === 'query') return `/articles?tag=${encodeURIComponent(tag)}`;

  return `/articles/tag/${encodeURIComponent(tag)}`;
};

/**
 * 태그 필터 렌더링에 필요한 파생 링크 모델만 미리 계산합니다.
 */
const buildTagLinkItems = (
  items: readonly ArticleTagFilterItem[],
  activeTag: string,
  defaultLabel: string,
  hrefMode: ArticleTagHrefMode,
): ArticleTagLinkItem[] => [
  {
    articleCount: null,
    href: createTagHref('', hrefMode),
    isActive: activeTag.length === 0,
    key: '__all__',
    label: defaultLabel,
    tag: '',
  },
  ...items.map(item => ({
    articleCount: item.articleCount ?? null,
    href: createTagHref(item.tag, hrefMode),
    isActive: item.tag === activeTag,
    key: item.tag,
    label: item.label,
    tag: item.tag,
  })),
];

/**
 * 아티클 목록 우측 패널에서 사용하는 인기 태그 필터 목록입니다.
 *
 * 태그는 URL 기반 필터이므로 버튼이 아니라 링크로 렌더링합니다.
 */
const ArticleTagFilterListBase = ({
  activeTag,
  defaultLabel,
  emptyText,
  hrefMode = 'query',
  items,
  itemDivider = 'none',
  loadingText,
  onNavigationStart,
  pending = false,
  title,
}: ArticleTagFilterListProps) => {
  const linkItems = React.useMemo(
    () => (pending ? [] : buildTagLinkItems(items, activeTag, defaultLabel, hrefMode)),
    [activeTag, defaultLabel, hrefMode, items, pending],
  );

  return (
    <section aria-labelledby="article-tag-filter-title" className={sectionClass}>
      <h2 className={titleClass} id="article-tag-filter-title">
        {title}
      </h2>
      {pending ? (
        <p aria-live="polite" className={emptyClass}>
          {loadingText ?? emptyText}
        </p>
      ) : linkItems.length > 0 ? (
        <div className={listClass}>
          {linkItems.map((item, index) => (
            <React.Fragment key={item.key}>
              <Link
                aria-current={item.isActive ? 'page' : undefined}
                className={cx(tagLinkClass, item.isActive ? activeTagLinkClass : undefined)}
                href={item.href}
                onClick={() => onNavigationStart?.({ nextTag: item.tag })}
              >
                <span>{item.label}</span>
                {typeof item.articleCount === 'number' ? (
                  <span className={countClass}>({item.articleCount})</span>
                ) : null}
              </Link>
              {itemDivider === 'dot' && index < linkItems.length - 1 ? (
                <span aria-hidden="true" className={dividerClass}>
                  ·
                </span>
              ) : null}
            </React.Fragment>
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
  fontWeight: 'semibold',
});

const countClass = css({
  color: 'muted',
  fontSize: '[0.6875rem]',
  letterSpacing: '[-0.01em]',
});

const dividerClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  color: 'muted',
  fontSize: 'sm',
  lineHeight: 'none',
});

const emptyClass = css({
  color: 'muted',
  fontSize: 'sm',
});
