'use client';

import React from 'react';

import type { LocalizedArticleTagStat } from '@/entities/article/model/types';
import { ArticleTagFilterList } from '@/features/article-tag-filter/ui/article-tag-filter-list';

type DeferredArticleTagFilterListProps = {
  activeTag: string;
  emptyText: string;
  loadingText: string;
  locale: string;
  title: string;
};

/**
 * 인기 태그 집계는 hydration 이후 별도 요청으로 불러오고,
 * 첫 문서 렌더에서는 목록 본문을 막지 않도록 분리합니다.
 */
export const DeferredArticleTagFilterList = ({
  activeTag,
  emptyText,
  loadingText,
  locale,
  title,
}: DeferredArticleTagFilterListProps) => {
  const [items, setItems] = React.useState<LocalizedArticleTagStat[]>([]);
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  React.useEffect(() => {
    const abortController = new AbortController();

    const loadItems = async () => {
      setStatus('loading');

      try {
        const searchParams = new URLSearchParams({
          locale,
        });
        const response = await fetch(`/api/article-popular-tags?${searchParams.toString()}`, {
          method: 'GET',
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load article popular tags: ${response.status}`);
        }

        const data = (await response.json()) as LocalizedArticleTagStat[];
        setItems(data);
        setStatus('ready');
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        console.error('[articles] deferred popular tags failed', {
          error,
          locale,
        });
        setItems([]);
        setStatus('error');
      }
    };

    void loadItems();

    return () => {
      abortController.abort();
    };
  }, [locale]);

  return (
    <ArticleTagFilterList
      activeTag={activeTag}
      emptyText={emptyText}
      items={items}
      loadingText={loadingText}
      pending={status === 'idle' || status === 'loading'}
      title={title}
    />
  );
};
