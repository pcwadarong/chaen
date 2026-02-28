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
  borderRadius: '1.5rem',
  border: '1px solid rgba(23, 23, 23, 0.08)',
  background:
    'linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.56)), rgba(255, 255, 255, 0.7)',
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
  borderRadius: '999px',
  backgroundColor: 'rgba(23, 23, 23, 0.06)',
  fontSize: '0.82rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgba(23, 23, 23, 0.56)',
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
  color: 'rgba(23, 23, 23, 0.72)',
};
