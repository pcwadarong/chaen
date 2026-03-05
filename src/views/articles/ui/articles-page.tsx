'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import type { Article } from '@/entities/article/model/types';
import { ArticleFeed } from '@/features/article-feed/ui/article-feed';

export type ArticlesPageProps = {
  initialCursor: string | null;
  initialItems: Article[];
  locale: string;
};

/** 아티클 목록 화면의 실제 페이지 컨테이너입니다. */
export const ArticlesPage = ({ initialCursor, initialItems, locale }: ArticlesPageProps) => {
  const t = useTranslations('Articles');

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <h1 style={titleStyle}>{t('title')}</h1>
        <p style={descriptionStyle}>{t('description')}</p>
      </section>
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
    </main>
  );
};

const pageStyle: CSSProperties = {
  width: 'min(1120px, calc(100% - 2rem))',
  margin: '0 auto',
  padding: '3rem 0 5rem',
  display: 'grid',
  gap: '1.5rem',
};

const heroStyle: CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
};

const titleStyle: CSSProperties = {
  fontSize: 'clamp(2rem, 4vw, 3.25rem)',
  lineHeight: 0.96,
  letterSpacing: '-0.04em',
};

const descriptionStyle: CSSProperties = {
  maxWidth: '52rem',
  color: 'rgb(var(--color-muted))',
};
