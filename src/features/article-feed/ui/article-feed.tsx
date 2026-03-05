'use client';

import { css } from '@emotion/react';
import { useEffect, useRef } from 'react';

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
    <section css={sectionStyle}>
      {errorMessage && items.length === 0 ? (
        <div css={errorPanelStyle}>
          <p css={errorTextStyle}>{loadErrorText}</p>
          <button onClick={() => void loadMore()} css={retryButtonStyle} type="button">
            {retryText}
          </button>
        </div>
      ) : items.length > 0 ? (
        <div css={gridStyle}>
          {items.map(article => (
            <ArticleCard article={article} key={`${article.id}-${article.created_at}`} />
          ))}
        </div>
      ) : (
        <p css={emptyStyle}>{emptyText}</p>
      )}

      <div aria-hidden ref={sentinelRef} css={sentinelStyle} />
      {isLoadingMore ? (
        <p aria-live="polite" css={stateTextStyle}>
          {loadingText}
        </p>
      ) : null}
      {!hasMore && items.length > 0 ? <p css={stateTextStyle}>{loadMoreEndText}</p> : null}
      {errorMessage && items.length > 0 ? (
        <p aria-live="polite" css={errorTextStyle}>
          {loadErrorText}
        </p>
      ) : null}
    </section>
  );
};

const sectionStyle = css`
  display: grid;
  gap: 0.8rem;
`;

const gridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  grid-auto-rows: 1fr;
  align-items: stretch;
  gap: 1rem;
`;

const emptyStyle = css`
  border-radius: var(--radius-md);
  border: 1px solid rgb(var(--color-border) / 0.24);
  padding: 1rem 1.25rem;
  color: rgb(var(--color-muted));
`;

const sentinelStyle = css`
  width: 100%;
  height: 1px;
`;

const stateTextStyle = css`
  color: rgb(var(--color-muted));
  text-align: center;
`;

const errorPanelStyle = css`
  display: grid;
  gap: 0.75rem;
  justify-items: center;
  border-radius: var(--radius-md);
  border: 1px solid rgb(var(--color-border) / 0.24);
  padding: 1rem 1.25rem;
`;

const errorTextStyle = css`
  color: rgb(var(--color-danger, 210 75 75));
  text-align: center;
`;

const retryButtonStyle = css`
  min-height: 2.4rem;
  padding: 0 1rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--color-border) / 0.35);
  background-color: transparent;
  color: rgb(var(--color-text));
`;
