'use client';

import React, { useEffect, useRef } from 'react';
import { css } from 'styled-system/css';

import type { ArticleListItem } from '@/entities/article/model/types';
import { ArticleListItem as ArticleWideListItem } from '@/entities/article/ui/article-list-item';
import { useArticleFeed } from '@/features/article-feed/model/use-article-feed';
import { Button } from '@/shared/ui/button/button';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

type ArticleFeedProps = {
  activeTag: string;
  emptyText: string;
  initialCursor: string | null;
  initialItems: ArticleListItem[];
  loadErrorText: string;
  loadMoreEndText: string;
  loadingText: string;
  locale: string;
  query: string;
  retryText: string;
};

/**
 * 아티클 목록의 무한 스크롤 피드를 렌더링합니다.
 */
export const ArticleFeed = ({
  activeTag,
  emptyText,
  initialCursor,
  initialItems,
  loadErrorText,
  loadMoreEndText,
  loadingText,
  locale,
  query,
  retryText,
}: ArticleFeedProps) => {
  const { errorMessage, hasMore, isLoadingMore, items, loadMore } = useArticleFeed({
    activeTag,
    initialCursor,
    initialItems,
    locale,
    query,
  });
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        const target = entries[0];
        if (!target?.isIntersecting) return;
        void loadMore();
      },
      {
        root: null,
        threshold: 0.25,
      },
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <section className={sectionClass}>
      {errorMessage && items.length === 0 ? (
        <div className={errorPanelClass}>
          <p className={errorTextClass}>{loadErrorText}</p>
          <Button onClick={() => void loadMore()} tone="white" variant="ghost">
            {retryText}
          </Button>
        </div>
      ) : items.length > 0 ? (
        <ol className={listClass}>
          {items.map(article => (
            <li className={itemClass} key={`${article.id}-${article.created_at}`}>
              <ArticleWideListItem article={article} />
            </li>
          ))}
        </ol>
      ) : (
        <p className={emptyClass}>{emptyText}</p>
      )}

      <div aria-hidden className={sentinelClass} ref={sentinelRef} />
      {isLoadingMore ? (
        <p aria-live="polite" className={stateTextClass}>
          {loadingText}
        </p>
      ) : null}
      {!hasMore && items.length > 0 ? (
        <p aria-live="polite" className={srOnlyClass}>
          {loadMoreEndText}
        </p>
      ) : null}
      {errorMessage && items.length > 0 ? (
        <p aria-live="polite" className={errorTextClass}>
          {loadErrorText}
        </p>
      ) : null}
    </section>
  );
};

const sectionClass = css({
  display: 'grid',
  gap: '3',
});

const listClass = css({
  listStyle: 'none',
  m: '0',
  p: '0',
  borderBottom: '[1px solid rgb(var(--color-border) / 0.3)]',
});

const itemClass = css({
  m: '0',
  borderTop: '[1px solid rgb(var(--color-border) / 0.3)]',
  _first: {
    borderTop: 'none',
  },
});

const emptyClass = css({
  borderRadius: 'md',
  border: '[1px solid rgb(var(--color-border) / 0.24)]',
  px: '5',
  py: '4',
  color: 'muted',
});

const sentinelClass = css({
  width: 'full',
  height: '[1px]',
});

const stateTextClass = css({
  color: 'muted',
  textAlign: 'center',
});

const errorPanelClass = css({
  display: 'grid',
  gap: '3',
  justifyItems: 'center',
  borderRadius: 'md',
  border: '[1px solid rgb(var(--color-border) / 0.24)]',
  px: '5',
  py: '4',
});

const errorTextClass = css({
  color: 'danger',
  textAlign: 'center',
});
