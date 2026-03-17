'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { css } from 'styled-system/css';

import type { ArticleListItem } from '@/entities/article/model/types';
import { ArticleListItem as ArticleWideListItem } from '@/entities/article/ui/article-list-item';
import { useBrowseArticles } from '@/features/browse-articles/model/use-browse-articles';
import { useAutoLoadAfterScroll } from '@/shared/lib/react/use-auto-load-after-scroll';
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

type ArticleFeedContentProps = {
  emptyText: string;
  items: ArticleListItem[];
};

type ArticleFeedErrorPanelProps = {
  loadErrorText: string;
  onRetry: () => void;
  retryText: string;
};

/**
 * 아티클 리스트 또는 빈 상태만 렌더링하는 본문 블록입니다.
 */
const ArticleFeedContentBase = ({ emptyText, items }: ArticleFeedContentProps) =>
  items.length > 0 ? (
    <ol className={listClass}>
      {items.map(article => (
        <li className={itemClass} key={article.id}>
          <ArticleWideListItem article={article} />
        </li>
      ))}
    </ol>
  ) : (
    <p className={emptyClass}>{emptyText}</p>
  );

ArticleFeedContentBase.displayName = 'ArticleFeedContent';

const ArticleFeedContent = React.memo(ArticleFeedContentBase);

/**
 * 초기 로드 실패 시 재시도 액션을 포함한 에러 패널입니다.
 */
const ArticleFeedErrorPanelBase = ({
  loadErrorText,
  onRetry,
  retryText,
}: ArticleFeedErrorPanelProps) => (
  <div className={errorPanelClass}>
    <p className={errorTextClass}>{loadErrorText}</p>
    <Button onClick={onRetry} tone="white" variant="ghost">
      {retryText}
    </Button>
  </div>
);

ArticleFeedErrorPanelBase.displayName = 'ArticleFeedErrorPanel';

const ArticleFeedErrorPanel = React.memo(ArticleFeedErrorPanelBase);

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
  const { errorMessage, hasMore, isLoadingMore, items, loadMore } = useBrowseArticles({
    activeTag,
    initialCursor,
    initialItems,
    locale,
    query,
  });
  const isAutoLoadEnabled = useAutoLoadAfterScroll();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const handleLoadMore = useCallback(() => {
    void loadMore();
  }, [loadMore]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        const target = entries[0];
        if (!target?.isIntersecting || !isAutoLoadEnabled) return;
        handleLoadMore();
      },
      {
        root: null,
        threshold: 0.25,
      },
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [handleLoadMore, isAutoLoadEnabled]);

  return (
    <section className={sectionClass}>
      {errorMessage && items.length === 0 ? (
        <ArticleFeedErrorPanel
          loadErrorText={loadErrorText}
          onRetry={handleLoadMore}
          retryText={retryText}
        />
      ) : (
        <ArticleFeedContent emptyText={emptyText} items={items} />
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
  borderBottom: '[1px solid var(--colors-border)]',
});

const itemClass = css({
  m: '0',
  borderTop: '[1px solid var(--colors-border)]',
  _first: {
    borderTop: 'none',
  },
});

const emptyClass = css({
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
  border: '[1px solid var(--colors-border)]',
  px: '5',
  py: '4',
});

const errorTextClass = css({
  color: 'error',
  textAlign: 'center',
});
