'use client';

import { useTranslations } from 'next-intl';

import type { Article } from '@/entities/article/model/types';
import { ArticleFeed } from '@/features/article-feed/ui/article-feed';
import { PageHeader, PageSection, PageShell } from '@/shared/ui/page-shell/page-shell';

export type ArticlesPageProps = {
  initialCursor: string | null;
  initialItems: Article[];
  locale: string;
};

/** 아티클 목록 화면의 실제 페이지 컨테이너입니다. */
export const ArticlesPage = ({ initialCursor, initialItems, locale }: ArticlesPageProps) => {
  const t = useTranslations('Articles');

  return (
    <PageShell>
      <PageHeader description={t('description')} title={t('title')} />
      <PageSection>
        <ArticleFeed
          emptyText={t('emptyItems')}
          initialCursor={initialCursor}
          initialItems={initialItems}
          loadErrorText={t('loadError')}
          loadMoreEndText={t('loadMoreEnd')}
          loadingText={t('loading')}
          locale={locale}
          retryText={t('retry')}
        />
      </PageSection>
    </PageShell>
  );
};
