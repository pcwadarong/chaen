'use client';

import { css } from '@emotion/react';
import { useTranslations } from 'next-intl';

import type { ArticleListItem, LocalizedArticleTagStat } from '@/entities/article/model/types';
import { ArticleFeed } from '@/features/article-feed/ui/article-feed';
import { ArticleSearchForm } from '@/features/article-feed/ui/article-search-form';
import { ArticleTagFilterList } from '@/features/article-feed/ui/article-tag-filter-list';
import { PageHeader, PageSection, PageShell } from '@/shared/ui/page-shell/page-shell';

export type ArticlesPageProps = {
  activeTag: string;
  initialCursor: string | null;
  initialItems: ArticleListItem[];
  locale: string;
  popularTags: LocalizedArticleTagStat[];
  searchQuery: string;
};

/** 아티클 목록 화면의 실제 페이지 컨테이너입니다. */
export const ArticlesPage = ({
  activeTag,
  initialCursor,
  initialItems,
  locale,
  popularTags,
  searchQuery,
}: ArticlesPageProps) => {
  const t = useTranslations('Articles');

  return (
    <PageShell>
      <PageHeader description={t('description')} title={t('title')} />
      <PageSection>
        <div css={layoutStyle}>
          <div css={feedColumnStyle}>
            <ArticleFeed
              activeTag={activeTag}
              key={`${locale}:${searchQuery}:${activeTag}`}
              emptyText={t('emptyItems')}
              initialCursor={initialCursor}
              initialItems={initialItems}
              loadErrorText={t('loadError')}
              loadMoreEndText={t('loadMoreEnd')}
              loadingText={t('loading')}
              locale={locale}
              query={searchQuery}
              retryText={t('retry')}
            />
          </div>
          <aside css={sidebarStyle}>
            <div css={sidebarPanelStyle}>
              <div css={desktopSearchFormStyle}>
                <ArticleSearchForm
                  clearText={t('searchClear')}
                  pendingText={t('loading')}
                  placeholder={t('searchPlaceholder')}
                  searchQuery={searchQuery}
                  submitText={t('searchSubmit')}
                />
              </div>
              <ArticleTagFilterList
                activeTag={activeTag}
                emptyText={t('popularTagsEmpty')}
                items={popularTags}
                title={t('popularTagsTitle')}
              />
            </div>
          </aside>
        </div>
      </PageSection>
    </PageShell>
  );
};

const layoutStyle = css`
  display: grid;
  gap: var(--space-6);

  @media (min-width: 961px) {
    grid-template-columns: minmax(0, 1fr) 18rem;
    align-items: start;
  }
`;

const feedColumnStyle = css`
  min-width: 0;
  order: 2;

  @media (min-width: 961px) {
    order: 1;
  }
`;

const sidebarStyle = css`
  order: 1;

  @media (min-width: 961px) {
    position: sticky;
    top: var(--space-8);
    order: 2;
  }
`;

const sidebarPanelStyle = css`
  display: grid;
  gap: var(--space-4);
`;

const desktopSearchFormStyle = css`
  display: none;

  @media (min-width: 961px) {
    display: block;
  }
`;
