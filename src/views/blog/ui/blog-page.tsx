'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import { articleItems } from '@/entities/article/model/article-items';
import { ArticleCard } from '@/entities/article/ui/article-card';

/** 블로그 목록 화면의 실제 페이지 컨테이너입니다. */
export const BlogPage = () => {
  const t = useTranslations('Blog');

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>{t('eyebrow')}</p>
        <h1 style={titleStyle}>{t('title')}</h1>
        <p style={descriptionStyle}>{t('description')}</p>
      </section>
      <section style={stackStyle}>
        {articleItems.map(article => (
          <ArticleCard article={article} key={article.id} />
        ))}
      </section>
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

const eyebrowStyle: CSSProperties = {
  fontSize: '0.82rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgb(var(--color-muted))',
};

const titleStyle: CSSProperties = {
  fontSize: 'clamp(2.4rem, 6vw, 4.8rem)',
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
  gap: '1rem',
};
