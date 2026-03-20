import { useTranslations } from 'next-intl';
import React from 'react';
import { css } from 'styled-system/css';

import type { ArticleListItem } from '@/entities/article/model/types';
import { ArticleSearchForm } from '@/features/article-search/ui/article-search-form';
import { DeferredArticleTagFilterList } from '@/features/article-tag-filter/ui/deferred-article-tag-filter-list';
import { ArticleFeed } from '@/widgets/article-feed/ui/article-feed';
import { PageHeader, PageSection, PageShell } from '@/widgets/page-shell/ui/page-shell';

export type ArticlesPageProps = {
  activeTag: string;
  feedLocale: string;
  initialCursor: string | null;
  initialItems: ArticleListItem[];
  locale: string;
  pagination: {
    currentPage: number;
    nextHref: string | null;
    previousHref: string | null;
  };
  searchQuery: string;
};

/** 아티클 목록 화면의 실제 페이지 컨테이너입니다. */
export const ArticlesPage = ({
  activeTag,
  feedLocale,
  initialCursor,
  initialItems,
  locale,
  searchQuery,
}: ArticlesPageProps) => {
  const t = useTranslations('Articles');

  return (
    <PageShell hideAppFrameFooter>
      <PageHeader description={t('description')} title={t('title')} />
      <PageSection>
        <div className={layoutClass}>
          <div className={feedColumnClass}>
            <ArticleFeed
              activeTag={activeTag}
              key={`${feedLocale}:${searchQuery}:${activeTag}`}
              emptyText={t('emptyItems')}
              initialCursor={initialCursor}
              initialItems={initialItems}
              loadErrorText={t('loadError')}
              loadMoreEndText={t('loadMoreEnd')}
              loadingText={t('loading')}
              locale={feedLocale}
              query={searchQuery}
              retryText={t('retry')}
            />
          </div>
          <aside className={sidebarClass}>
            <div className={sidebarPanelClass}>
              <div className={desktopSearchFormClass}>
                <ArticleSearchForm
                  clearText={t('searchClear')}
                  key={`article-search:${locale}:${searchQuery}`}
                  pendingText={t('loading')}
                  placeholder={t('searchPlaceholder')}
                  searchQuery={searchQuery}
                  submitText={t('searchSubmit')}
                />
              </div>
              <DeferredArticleTagFilterList
                activeTag={activeTag}
                emptyText={t('popularTagsEmpty')}
                loadingText={t('popularTagsLoading')}
                locale={locale}
                title={t('popularTagsTitle')}
              />
            </div>
          </aside>
        </div>
      </PageSection>
    </PageShell>
  );
};

const layoutClass = css({
  display: 'grid',
  gap: '6',
  '@media (min-width: 961px)': {
    gridTemplateColumns: 'minmax(0, 1fr) 18rem',
    alignItems: 'start',
  },
});

const feedColumnClass = css({
  minWidth: '0',
  order: '2',
  '@media (min-width: 961px)': {
    order: '1',
  },
});

const sidebarClass = css({
  order: '1',
  '@media (min-width: 961px)': {
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
  '@media (min-width: 961px)': {
    display: 'block',
  },
});
