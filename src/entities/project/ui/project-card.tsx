import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import type { ProjectItem } from '@/entities/project/model/project-items';
import { Link } from '@/i18n/navigation';

type ProjectCardProps = {
  item: ProjectItem;
};

/** 프로젝트 요약 카드를 렌더링합니다. */
export const ProjectCard = ({ item }: ProjectCardProps) => {
  const t = useTranslations('Work');

  return (
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
        {t('viewProject')}
      </Link>
    </article>
  );
};

const cardStyle: CSSProperties = {
  minHeight: '18rem',
  display: 'grid',
  alignContent: 'space-between',
  gap: '1rem',
  padding: '1.5rem',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgb(var(--color-border) / 0.22)',
  background:
    'linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted))), rgb(var(--color-surface))',
};

const metaStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  color: 'rgb(var(--color-muted))',
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
  color: 'rgb(var(--color-muted))',
};

const cardLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'fit-content',
  minHeight: '2.75rem',
  padding: '0 1rem',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid rgb(var(--color-border) / 0.3)',
  backgroundColor: 'rgb(var(--color-surface) / 0.9)',
  textDecoration: 'none',
  color: 'rgb(var(--color-text))',
};
