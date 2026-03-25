'use client';

import React from 'react';
import { css } from 'styled-system/css';

import type { ArticleListItem } from '@/entities/article/model/types';
import { ArticleSearchForm } from '@/features/article-search/ui/article-search-form';
import { DeferredArticleTagFilterList } from '@/features/article-tag-filter/ui/deferred-article-tag-filter-list';
import { ArticleFeed } from '@/widgets/article-feed/ui/article-feed';

type ArticlesInteractiveShellProps = {
  activeTag: string;
  emptyText: string;
  feedLocale: string;
  initialCursor: string | null;
  initialItems: ArticleListItem[];
  loadErrorText: string;
  loadMoreEndText: string;
  loadingText: string;
  popularTagsEmptyText: string;
  popularTagsLoadingText: string;
  popularTagsTitle: string;
  query: string;
  retryText: string;
  searchClearText: string;
  searchPlaceholderText: string;
  searchSubmitText: string;
  tagLocale: string;
};

/**
 * 검색 전환이 진행되는 동안 피드 영역만 스켈레톤으로 대체합니다.
 */
export const ArticlesInteractiveShell = ({
  activeTag,
  emptyText,
  feedLocale,
  initialCursor,
  initialItems,
  loadErrorText,
  loadMoreEndText,
  loadingText,
  popularTagsEmptyText,
  popularTagsLoadingText,
  popularTagsTitle,
  query,
  retryText,
  searchClearText,
  searchPlaceholderText,
  searchSubmitText,
  tagLocale,
}: ArticlesInteractiveShellProps) => {
  const [isFeedPending, setIsFeedPending] = React.useState(false);

  React.useEffect(() => {
    setIsFeedPending(false);
  }, [activeTag, initialCursor, query]);

  return (
    <div className={layoutClass}>
      <div className={feedColumnClass}>
        {isFeedPending ? (
          <div aria-busy="true" aria-label={loadingText} className={pendingFeedClass} role="status">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className={pendingItemClass} key={index}>
                <div className={pendingTextColumnClass}>
                  <div className={pendingLineWideClass} />
                  <div className={pendingLineFullClass} />
                  <div className={pendingLineShortClass} />
                </div>
                <div className={pendingThumbClass} />
              </div>
            ))}
          </div>
        ) : (
          <ArticleFeed
            activeTag={activeTag}
            emptyText={emptyText}
            initialCursor={initialCursor}
            initialItems={initialItems}
            loadErrorText={loadErrorText}
            loadMoreEndText={loadMoreEndText}
            loadingText={loadingText}
            locale={feedLocale}
            query={query}
            retryText={retryText}
          />
        )}
      </div>
      <aside className={sidebarClass}>
        <div className={sidebarPanelClass}>
          <div className={desktopSearchFormClass}>
            <ArticleSearchForm
              clearText={searchClearText}
              onPendingChange={setIsFeedPending}
              pendingText={loadingText}
              placeholder={searchPlaceholderText}
              searchQuery={query}
              submitText={searchSubmitText}
            />
          </div>
          <DeferredArticleTagFilterList
            activeTag={activeTag}
            emptyText={popularTagsEmptyText}
            loadingText={popularTagsLoadingText}
            locale={tagLocale}
            onNavigationStart={({ nextTag }) => {
              if (nextTag === activeTag && initialCursor === null && query.trim().length === 0) {
                return;
              }

              setIsFeedPending(true);
            }}
            title={popularTagsTitle}
          />
        </div>
      </aside>
    </div>
  );
};

const layoutClass = css({
  display: 'grid',
  gap: '6',
  _desktopUp: {
    gridTemplateColumns: 'minmax(0, 1fr) 18rem',
    alignItems: 'start',
  },
});

const feedColumnClass = css({
  minWidth: '0',
  order: '2',
  _desktopUp: {
    order: '1',
  },
});

const sidebarClass = css({
  order: '1',
  _desktopUp: {
    position: 'sticky',
    top: '8',
    order: '2',
  },
});

const sidebarPanelClass = css({
  display: 'grid',
  gap: '4',
});

const desktopSearchFormClass = css({
  display: 'none',
  _desktopUp: {
    display: 'block',
  },
});

const pendingFeedClass = css({
  display: 'grid',
  borderBottom: '[1px solid var(--colors-border)]',
});

const pendingItemClass = css({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '5',
  py: '7',
  borderTop: '[1px solid var(--colors-border)]',
  _first: {
    borderTop: 'none',
  },
});

const pendingTextColumnClass = css({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: '4',
  flex: '[1 1 auto]',
  minWidth: '0',
  minHeight: '[8.75rem]',
});

const pendingLineWideClass = css({
  width: '[72%]',
  height: '5',
  borderRadius: 'md',
  background:
    '[linear-gradient(90deg, rgba(148,163,184,0.10) 0%, rgba(148,163,184,0.22) 48%, rgba(148,163,184,0.10) 100%)]',
  backgroundSize: '[200% 100%]',
  animation: '[route-skeleton-shimmer 1.4s ease-in-out infinite]',
});

const pendingLineFullClass = css({
  width: '[88%]',
  height: '5',
  borderRadius: 'md',
  background:
    '[linear-gradient(90deg, rgba(148,163,184,0.10) 0%, rgba(148,163,184,0.22) 48%, rgba(148,163,184,0.10) 100%)]',
  backgroundSize: '[200% 100%]',
  animation: '[route-skeleton-shimmer 1.4s ease-in-out infinite]',
});

const pendingLineShortClass = css({
  width: '[28%]',
  height: '5',
  borderRadius: 'md',
  background:
    '[linear-gradient(90deg, rgba(148,163,184,0.10) 0%, rgba(148,163,184,0.22) 48%, rgba(148,163,184,0.10) 100%)]',
  backgroundSize: '[200% 100%]',
  animation: '[route-skeleton-shimmer 1.4s ease-in-out infinite]',
});

const pendingThumbClass = css({
  width: '[7rem]',
  height: '[8.75rem]',
  flexShrink: '0',
  borderRadius: 'lg',
  background:
    '[linear-gradient(90deg, rgba(148,163,184,0.10) 0%, rgba(148,163,184,0.22) 48%, rgba(148,163,184,0.10) 100%)]',
  backgroundSize: '[200% 100%]',
  animation: '[route-skeleton-shimmer 1.4s ease-in-out infinite]',
  _mobileLargeDown: {
    display: 'none',
  },
});
