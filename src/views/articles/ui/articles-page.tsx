'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import type { Article } from '@/entities/article/model/types';
import { ArticleCard } from '@/entities/article/ui/article-card';

type ArticlesPageProps = {
  items: Article[];
};

/** 아티클 목록 화면의 실제 페이지 컨테이너입니다. */
export const ArticlesPage = ({ items }: ArticlesPageProps) => {
  const t = useTranslations('Articles');

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <h1 style={titleStyle}>{t('title')}</h1>
        <p style={descriptionStyle}>{t('description')}</p>
      </section>
      {items.length > 0 ? (
        <section style={stackStyle}>
          {items.map(article => (
            <ArticleCard article={article} key={`${article.id}-${article.created_at}`} />
          ))}
        </section>
      ) : (
        <p style={emptyStyle}>{t('emptyItems')}</p>
      )}
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

const stackStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gridAutoRows: '1fr',
  alignItems: 'stretch',
  gap: '1rem',
};

const emptyStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid rgb(var(--color-border) / 0.24)',
  padding: '1rem 1.25rem',
  color: 'rgb(var(--color-muted))',
};
