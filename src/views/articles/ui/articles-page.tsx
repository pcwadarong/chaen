import { useTranslations } from 'next-intl';
import React from 'react';

import type { ArticleListItem } from '@/entities/article/model/types';
import { ArticlesInteractiveShell } from '@/views/articles/ui/articles-interactive-shell';
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
  searchQuery,
}: ArticlesPageProps) => {
  const t = useTranslations('Articles');

  return (
    <PageShell hideAppFrameFooter>
      <PageHeader description={t('description')} title={t('title')} />
      <PageSection>
        <ArticlesInteractiveShell
          activeTag={activeTag}
          emptyText={t('emptyItems')}
          initialCursor={initialCursor}
          initialItems={initialItems}
          loadErrorText={t('loadError')}
          loadMoreEndText={t('loadMoreEnd')}
          loadingText={t('loading')}
          locale={feedLocale}
          popularTagsEmptyText={t('popularTagsEmpty')}
          popularTagsLoadingText={t('popularTagsLoading')}
          popularTagsTitle={t('popularTagsTitle')}
          query={searchQuery}
          retryText={t('retry')}
          searchClearText={t('searchClear')}
          searchPlaceholderText={t('searchPlaceholder')}
          searchSubmitText={t('searchSubmit')}
        />
      </PageSection>
    </PageShell>
  );
};
