'use client';

import { useQuery } from '@tanstack/react-query';
import React, { useCallback } from 'react';

import type { LocalizedArticleTagStat } from '@/entities/article/model/types';
import type { TagOption } from '@/entities/tag/api/tag.types';
import {
  type ArticleTagFilterItem,
  ArticleTagFilterList,
} from '@/features/article-tag-filter/ui/article-tag-filter-list';
import type { AppLocale } from '@/i18n/routing';
import { articles, tags } from '@/shared/lib/query/query-keys';

type TagSourceResponse = LocalizedArticleTagStat[] | TagOption[];

const EMPTY_TAG_FILTER_ITEMS: ArticleTagFilterItem[] = [];

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
  data: TagSourceResponse,
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
  const selectTagFilterItems = useCallback(
    (data: TagSourceResponse) => mapTagSourceItems(source, data),
    [source],
  );
  const { data, isPending } = useQuery({
    queryFn: async ({ signal }): Promise<TagSourceResponse> => {
      const searchParams = new URLSearchParams({
        locale,
      });
      const response = await fetch(
        `${source === 'all' ? '/api/tags' : '/api/article-popular-tags'}?${searchParams.toString()}`,
        {
          method: 'GET',
          signal,
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to load article ${source} tags: ${response.status}`);
      }

      return (await response.json()) as TagSourceResponse;
    },
    queryKey:
      source === 'all' ? tags.all(locale as AppLocale) : articles.popularTags(locale as AppLocale),
    select: selectTagFilterItems,
  });

  return (
    <ArticleTagFilterList
      activeTag={activeTag}
      defaultLabel={defaultLabel}
      emptyText={emptyText}
      hrefMode={resolvedHrefMode}
      items={data ?? EMPTY_TAG_FILTER_ITEMS}
      itemDivider={source === 'all' ? 'dot' : 'none'}
      loadingText={loadingText}
      onNavigationStart={onNavigationStart}
      pending={isPending}
      title={title}
    />
  );
};
