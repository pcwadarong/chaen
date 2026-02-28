import Link from 'next/link';
import type { CSSProperties } from 'react';

import type { ProjectItem } from '@/entities/project/model/project-items';

type ProjectCardProps = {
  item: ProjectItem;
};

/** 프로젝트 요약 카드를 렌더링합니다. */
export const ProjectCard = ({ item }: ProjectCardProps) => (
  <article style={cardStyle}>
    <div style={metaStyle}>
      <span>{item.category}</span>
      <span>{item.year}</span>
    </div>
    <div style={bodyStyle}>
      <h3 style={titleStyle}>{item.headline}</h3>
      <p style={summaryStyle}>{item.summary}</p>
    </div>
    <Link href={`/work/${item.id}`} style={cardLinkStyle}>
      View project
    </Link>
  </article>
);

const cardStyle: CSSProperties = {
  minHeight: '18rem',
  display: 'grid',
  alignContent: 'space-between',
  gap: '1rem',
  padding: '1.5rem',
  borderRadius: '1.5rem',
  border: '1px solid rgb(var(--grayscale-7) / 0.08)',
  background:
    'linear-gradient(180deg, rgb(var(--grayscale-1) / 0.88), rgb(var(--grayscale-1) / 0.56)), rgb(var(--grayscale-1) / 0.7)',
};

const metaStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  color: 'rgb(var(--grayscale-7) / 0.56)',
  fontSize: '0.92rem',
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

const summaryStyle: CSSProperties = {
  color: 'rgb(var(--grayscale-7) / 0.72)',
};

const cardLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'fit-content',
  minHeight: '2.75rem',
  padding: '0 1rem',
  borderRadius: '999px',
  border: '1px solid rgb(var(--grayscale-7) / 0.12)',
  backgroundColor: 'rgb(var(--grayscale-1) / 0.9)',
  textDecoration: 'none',
  color: 'inherit',
};
