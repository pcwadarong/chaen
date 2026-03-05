'use client';

import { type CSSProperties, useEffect, useRef } from 'react';

import type { Article } from '@/entities/article/model/types';
import { ArticleCard } from '@/entities/article/ui/article-card';
import { useArticleFeed } from '@/features/article-feed/model/use-article-feed';

type ArticleFeedProps = {
  emptyText: string;
  initialCursor: string | null;
  initialItems: Article[];
  loadErrorText: string;
  loadMoreEndText: string;
  loadingText: string;
  locale: string;
  retryText: string;
};

/**
 * 아티클 목록의 무한 스크롤 피드를 렌더링합니다.
 */
export const ArticleFeed = ({
  emptyText,
  initialCursor,
  initialItems,
  loadErrorText,
  loadMoreEndText,
  loadingText,
  locale,
  retryText,
}: ArticleFeedProps) => {
  const { errorMessage, hasMore, isLoadingMore, items, loadMore } = useArticleFeed({
    initialCursor,
    initialItems,
    locale,
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
    <section style={sectionStyle}>
      {errorMessage && items.length === 0 ? (
        <div style={errorPanelStyle}>
          <p style={errorTextStyle}>{loadErrorText}</p>
          <button onClick={() => void loadMore()} style={retryButtonStyle} type="button">
            {retryText}
          </button>
        </div>
      ) : items.length > 0 ? (
        <div style={gridStyle}>
          {items.map(article => (
            <ArticleCard article={article} key={`${article.id}-${article.created_at}`} />
          ))}
        </div>
      ) : (
        <p style={emptyStyle}>{emptyText}</p>
      )}

      <div aria-hidden ref={sentinelRef} style={sentinelStyle} />
      {isLoadingMore ? (
        <p aria-live="polite" style={stateTextStyle}>
          {loadingText}
        </p>
      ) : null}
      {!hasMore && items.length > 0 ? <p style={stateTextStyle}>{loadMoreEndText}</p> : null}
      {errorMessage && items.length > 0 ? (
        <p aria-live="polite" style={errorTextStyle}>
          {loadErrorText}
        </p>
      ) : null}
    </section>
  );
};

const sectionStyle: CSSProperties = {
  display: 'grid',
  gap: '0.8rem',
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gridAutoRows: '1fr',
  alignItems: 'stretch',
  gap: '1rem',
};

const emptyStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid rgb(var(--color-border) / 0.24)',
  padding: '1rem 1.25rem',
  color: 'rgb(var(--color-muted))',
};

const sentinelStyle: CSSProperties = {
  width: '100%',
  height: '1px',
};

const stateTextStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
  textAlign: 'center',
};

const errorPanelStyle: CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
  justifyItems: 'center',
  borderRadius: 'var(--radius-md)',
  border: '1px solid rgb(var(--color-border) / 0.24)',
  padding: '1rem 1.25rem',
};

const errorTextStyle: CSSProperties = {
  color: 'rgb(var(--color-danger, 210 75 75))',
  textAlign: 'center',
};

const retryButtonStyle: CSSProperties = {
  minHeight: '2.4rem',
  padding: '0 1rem',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid rgb(var(--color-border) / 0.35)',
  backgroundColor: 'transparent',
  color: 'rgb(var(--color-text))',
};
