import type { CSSProperties } from 'react';

import { articleItems } from '@/entities/article/model/article-items';
import { ArticleCard } from '@/entities/article/ui/article-card';

/** 블로그 목록 화면의 실제 페이지 컨테이너입니다. */
export const BlogPage = () => (
  <main style={pageStyle}>
    <section style={heroStyle}>
      <p style={eyebrowStyle}>Blog</p>
      <h1 style={titleStyle}>Technical writing, tags, search, and comments later.</h1>
      <p style={descriptionStyle}>
        지금은 블로그 리스트와 기본 정보 구조만 두고, 검색과 태그 필터, 댓글 작성은 feature로 분리할
        예정입니다.
      </p>
    </section>
    <section style={stackStyle}>
      {articleItems.map(article => (
        <ArticleCard article={article} key={article.id} />
      ))}
    </section>
  </main>
);

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
  color: 'rgb(var(--grayscale-7) / 0.56)',
};

const titleStyle: CSSProperties = {
  fontSize: 'clamp(2.4rem, 6vw, 4.8rem)',
  lineHeight: 0.96,
  letterSpacing: '-0.04em',
};

const descriptionStyle: CSSProperties = {
  maxWidth: '52rem',
  color: 'rgb(var(--grayscale-7) / 0.72)',
};

const stackStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem',
};
