import type { CSSProperties } from 'react';

import type { ProjectItem } from '@/entities/project/model/project-items';
import { ProjectCard } from '@/entities/project/ui/project-card';

type ProjectShowcaseProps = {
  description: string;
  items: ProjectItem[];
  title: string;
};

/** 프로젝트 카드 묶음을 노출하는 위젯입니다. */
export const ProjectShowcase = ({ description, items, title }: ProjectShowcaseProps) => (
  <section style={sectionStyle}>
    <div style={headerStyle}>
      <h2 style={titleStyle}>{title}</h2>
      <p style={descriptionStyle}>{description}</p>
    </div>
    <div style={gridStyle}>
      {items.map(item => (
        <ProjectCard item={item} key={item.id} />
      ))}
    </div>
  </section>
);

const sectionStyle: CSSProperties = {
  display: 'grid',
  gap: '1.25rem',
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
  color: 'rgb(var(--grayscale-7) / 0.72)',
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem',
};
