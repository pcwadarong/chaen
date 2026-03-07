'use client';

import { css } from '@emotion/react';
import React, { useEffect, useRef } from 'react';

import type { ArticleListItem } from '@/entities/article/model/types';
import { ArticleListItem as ArticleWideListItem } from '@/entities/article/ui/article-list-item';
import { useArticleFeed } from '@/features/article-feed/model/use-article-feed';
import { Button } from '@/shared/ui/button/button';
import { srOnlyStyleObject } from '@/shared/ui/styles/sr-only-style';

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
    <section css={sectionStyle}>
      {errorMessage && items.length === 0 ? (
        <div css={errorPanelStyle}>
          <p css={errorTextStyle}>{loadErrorText}</p>
          <Button onClick={() => void loadMore()} tone="white" variant="ghost">
            {retryText}
          </Button>
        </div>
      ) : items.length > 0 ? (
        <ol css={listStyle}>
          {items.map(article => (
            <li css={itemStyle} key={`${article.id}-${article.created_at}`}>
              <ArticleWideListItem article={article} />
            </li>
          ))}
        </ol>
      ) : (
        <p css={emptyStyle}>{emptyText}</p>
      )}

      <div aria-hidden ref={sentinelRef} css={sentinelStyle} />
      {isLoadingMore ? (
        <p aria-live="polite" css={stateTextStyle}>
          {loadingText}
        </p>
      ) : null}
      {!hasMore && items.length > 0 ? (
        <p aria-live="polite" style={srOnlyStyleObject}>
          {loadMoreEndText}
        </p>
      ) : null}
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
  gap: var(--space-3);
`;

const listStyle = css`
  list-style: none;
  margin: 0;
  padding: 0;
  border-bottom: 1px solid rgb(var(--color-border) / 0.3);
`;

const itemStyle = css`
  margin: 0;
  border-top: 1px solid rgb(var(--color-border) / 0.3);

  &:first-of-type {
    border-top: none;
  }
`;

const emptyStyle = css`
  border-radius: var(--radius-md);
  border: 1px solid rgb(var(--color-border) / 0.24);
  padding: var(--space-4) var(--space-5);
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
  gap: var(--space-3);
  justify-items: center;
  border-radius: var(--radius-md);
  border: 1px solid rgb(var(--color-border) / 0.24);
  padding: var(--space-4) var(--space-5);
`;

const errorTextStyle = css`
  color: rgb(var(--color-danger));
  text-align: center;
`;
