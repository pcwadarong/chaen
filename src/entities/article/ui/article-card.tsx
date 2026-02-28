import type { CSSProperties } from 'react';

import type { ArticleItem } from '@/entities/article/model/article-items';

type ArticleCardProps = {
  article: ArticleItem;
};

/** 아티클 목록용 요약 카드를 렌더링합니다. */
export const ArticleCard = ({ article }: ArticleCardProps) => (
  <article style={cardStyle}>
    <div style={tagsStyle}>
      {article.tags.map(tag => (
        <span key={tag} style={tagStyle}>
          {tag}
        </span>
      ))}
    </div>
    <div style={bodyStyle}>
      <h3 style={titleStyle}>{article.title}</h3>
      <p style={descriptionStyle}>{article.description}</p>
    </div>
  </article>
);

const cardStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  padding: '1.5rem',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgb(var(--color-border) / 0.22)',
  background:
    'linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted))), rgb(var(--color-surface))',
};

const tagsStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
};

const tagStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '2rem',
  padding: '0 0.75rem',
  borderRadius: 'var(--radius-pill)',
  backgroundColor: 'rgb(var(--color-text) / 0.06)',
  fontSize: '0.82rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgb(var(--color-muted))',
};

const bodyStyle: CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
};

const titleStyle: CSSProperties = {
  fontSize: '1.35rem',
  lineHeight: 1.15,
  letterSpacing: '-0.03em',
};

const descriptionStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
};
