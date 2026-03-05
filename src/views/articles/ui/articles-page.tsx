'use client';

import { css } from '@emotion/react';
import { useTranslations } from 'next-intl';

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
    <main css={pageStyle}>
      <section css={heroStyle}>
        <h1 css={titleStyle}>{t('title')}</h1>
        <p css={descriptionStyle}>{t('description')}</p>
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

const pageStyle = css`
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 3rem 0 5rem;
  display: grid;
  gap: 1.5rem;
`;

const heroStyle = css`
  display: grid;
  gap: 0.75rem;
`;

const titleStyle = css`
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 0.96;
  letter-spacing: -0.04em;
`;

const descriptionStyle = css`
  max-width: 52rem;
  color: rgb(var(--color-muted));
`;
