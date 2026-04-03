'use client';

import React from 'react';

import type { LocalizedArticleTagStat } from '@/entities/article/model/types';
import type { TagOption } from '@/entities/tag/api/tag.types';
import {
  type ArticleTagFilterItem,
  ArticleTagFilterList,
} from '@/features/article-tag-filter/ui/article-tag-filter-list';

type TagFilterHrefMode = 'query' | 'tag-page';
type TagFilterSource = 'all' | 'popular';

type DeferredArticleTagFilterListProps = {
  activeTag: string;
  defaultLabel: string;
  emptyText: string;
  hrefMode?: TagFilterHrefMode;
  loadingText: string;
  locale: string;
  onNavigationStart?: (nextState: { nextTag: string }) => void;
  source?: TagFilterSource;
  title: string;
};

/**
 * 태그 소스 응답을 링크 목록 아이템 형태로 정규화합니다.
 */
const mapTagSourceItems = (
  source: TagFilterSource,
  data: LocalizedArticleTagStat[] | TagOption[],
): ArticleTagFilterItem[] => {
  if (source === 'all') {
    return (data as TagOption[]).map(item => ({
      label: item.label,
      tag: item.slug,
    }));
  }

  return (data as LocalizedArticleTagStat[]).map(item => ({
    articleCount: item.article_count,
    label: item.label,
    tag: item.tag,
  }));
};

/**
 * 인기 태그 집계는 hydration 이후 별도 요청으로 불러오고,
 * 첫 문서 렌더에서는 목록 본문을 막지 않도록 분리합니다.
 */
export const DeferredArticleTagFilterList = ({
  activeTag,
  defaultLabel,
  emptyText,
  loadingText,
  locale,
  onNavigationStart,
  source = 'popular',
  hrefMode,
  title,
}: DeferredArticleTagFilterListProps) => {
  const resolvedHrefMode = hrefMode ?? (source === 'all' ? 'tag-page' : 'query');
  const [items, setItems] = React.useState<ArticleTagFilterItem[]>([]);
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  React.useEffect(() => {
    const abortController = new AbortController();

    const loadItems = async () => {
      setStatus('loading');

      try {
        const searchParams = new URLSearchParams({
          locale,
        });
        const response = await fetch(
          `${
            source === 'all' ? '/api/tags' : '/api/article-popular-tags'
          }?${searchParams.toString()}`,
          {
            method: 'GET',
            signal: abortController.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to load article ${source} tags: ${response.status}`);
        }

        const data = (await response.json()) as LocalizedArticleTagStat[] | TagOption[];
        setItems(mapTagSourceItems(source, data));
        setStatus('ready');
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        console.error('[articles] deferred tags failed', {
          error,
          locale,
          source,
        });
        setItems([]);
        setStatus('error');
      }
    };

    void loadItems();

    return () => {
      abortController.abort();
    };
  }, [locale, source]);

  return (
    <ArticleTagFilterList
      activeTag={activeTag}
      defaultLabel={defaultLabel}
      emptyText={emptyText}
      hrefMode={resolvedHrefMode}
      items={items}
      itemDivider={source === 'all' ? 'dot' : 'none'}
      loadingText={loadingText}
      onNavigationStart={onNavigationStart}
      pending={status === 'idle' || status === 'loading'}
      title={title}
    />
  );
};
