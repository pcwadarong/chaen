import type { CSSProperties } from 'react';

/**
 * 프로젝트 상세 로딩 상태 UI입니다.
 */
const WorkDetailLoading = () => (
  <main style={pageStyle}>
    <section aria-busy="true" aria-live="polite" style={panelStyle}>
      <div style={lineLgStyle} />
      <div style={lineMdStyle} />
      <div style={lineSmStyle} />
    </section>
  </main>
);

const pageStyle: CSSProperties = {
  width: 'min(1120px, calc(100% - 2rem))',
  margin: '0 auto',
  padding: '3rem 0 5rem',
};

const panelStyle: CSSProperties = {
  display: 'grid',
  gap: '0.85rem',
  padding: '1.75rem',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgb(var(--color-border) / 0.2)',
  backgroundColor: 'rgb(var(--color-surface) / 0.9)',
};

const lineBaseStyle: CSSProperties = {
  height: '1rem',
  borderRadius: 'var(--radius-pill)',
  backgroundColor: 'rgb(var(--color-surface-muted))',
};

const lineLgStyle: CSSProperties = {
  ...lineBaseStyle,
  width: '62%',
};

const lineMdStyle: CSSProperties = {
  ...lineBaseStyle,
  width: '82%',
};

const lineSmStyle: CSSProperties = {
  ...lineBaseStyle,
  width: '45%',
};

export default WorkDetailLoading;
