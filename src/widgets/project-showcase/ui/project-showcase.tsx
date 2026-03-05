import type { CSSProperties } from 'react';

import type { Project } from '@/entities/project/model/types';
import { ProjectCard } from '@/entities/project/ui/project-card';

type ProjectShowcaseProps = {
  description: string;
  descriptionVisibility?: 'sr-only' | 'visible';
  emptyText: string;
  items: Project[];
  hideHeader?: boolean;
  title: string;
};

/** 프로젝트 카드 묶음을 노출하는 위젯입니다. */
export const ProjectShowcase = ({
  description,
  descriptionVisibility = 'visible',
  emptyText,
  hideHeader = false,
  items,
  title,
}: ProjectShowcaseProps) => (
  <section style={sectionStyle}>
    {hideHeader ? null : (
      <div style={headerStyle}>
        <h2 style={titleStyle}>{title}</h2>
        <p style={descriptionVisibility === 'sr-only' ? srOnlyStyle : descriptionStyle}>
          {description}
        </p>
      </div>
    )}
    {items.length > 0 ? (
      <div style={gridStyle}>
        {items.map(item => (
          <ProjectCard item={item} key={`${item.id}-${item.created_at}`} />
        ))}
      </div>
    ) : (
      <p style={emptyStyle}>{emptyText}</p>
    )}
  </section>
);

const sectionStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
};

const headerStyle: CSSProperties = {
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

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gridAutoRows: '1fr',
  alignItems: 'stretch',
  gap: '1rem',
};

const emptyStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
  padding: '1rem 0',
};

const srOnlyStyle: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};
