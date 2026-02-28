import type { CSSProperties } from 'react';

import type { ProjectItem } from '@/entities/project/model/project-items';

type WorkDetailPageProps = {
  item: ProjectItem;
};

/** 프로젝트 상세 페이지 컨테이너입니다. */
export const WorkDetailPage = ({ item }: WorkDetailPageProps) => (
  <main style={pageStyle}>
    <section style={heroStyle}>
      <div style={metaStyle}>
        <span>{item.category}</span>
        <span>{item.year}</span>
      </div>
      <h1 style={titleStyle}>{item.headline}</h1>
      <p style={descriptionStyle}>{item.summary}</p>
    </section>
    <section style={panelStyle}>
      <h2 style={sectionTitleStyle}>Deliverables</h2>
      <ul style={listStyle}>
        {item.deliverables.map(deliverable => (
          <li key={deliverable}>{deliverable}</li>
        ))}
      </ul>
    </section>
  </main>
);

const pageStyle: CSSProperties = {
  width: 'min(960px, calc(100% - 2rem))',
  margin: '0 auto',
  padding: '3rem 0 5rem',
  display: 'grid',
  gap: '1.5rem',
};

const heroStyle: CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
};

const metaStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  color: 'rgb(var(--grayscale-7) / 0.56)',
  fontSize: '0.92rem',
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

const panelStyle: CSSProperties = {
  padding: '1.5rem',
  borderRadius: '1.25rem',
  border: '1px solid rgb(var(--grayscale-7) / 0.08)',
  backgroundColor: 'rgb(var(--grayscale-1) / 0.76)',
};

const sectionTitleStyle: CSSProperties = {
  fontSize: '1.25rem',
  marginBottom: '1rem',
};

const listStyle: CSSProperties = {
  paddingLeft: '1rem',
  listStyle: 'disc',
  display: 'grid',
  gap: '0.75rem',
};
