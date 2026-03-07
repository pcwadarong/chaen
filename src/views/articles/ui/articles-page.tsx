'use client';

import { css } from '@emotion/react';
import { useTranslations } from 'next-intl';

import type { ArticleListItem } from '@/entities/article/model/types';
import { ArticleFeed } from '@/features/article-feed/ui/article-feed';
import { ArticleSearchForm } from '@/features/article-feed/ui/article-search-form';
import { PageHeader, PageSection, PageShell } from '@/shared/ui/page-shell/page-shell';

export type ArticlesPageProps = {
  initialCursor: string | null;
  initialItems: ArticleListItem[];
  locale: string;
  searchQuery: string;
};

/** 아티클 목록 화면의 실제 페이지 컨테이너입니다. */
export const ArticlesPage = ({
  initialCursor,
  initialItems,
  locale,
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
              key={`${locale}:${searchQuery}`}
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
              <ArticleSearchForm
                clearText={t('searchClear')}
                pendingText={t('loading')}
                placeholder={t('searchPlaceholder')}
                searchQuery={searchQuery}
                submitText={t('searchSubmit')}
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
