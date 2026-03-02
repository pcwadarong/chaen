import type { CSSProperties } from 'react';

/**
 * 프로젝트가 없을 때 보여주는 fallback 화면입니다.
 */
const WorkDetailNotFound = () => (
  <main style={pageStyle}>
    <section style={panelStyle}>
      <h1 style={titleStyle}>요청한 프로젝트를 찾을 수 없습니다.</h1>
      <p style={descriptionStyle}>
        프로젝트 ID를 다시 확인하거나 목록 페이지에서 다시 선택해 주세요.
      </p>
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
  gap: '0.8rem',
  padding: '1.75rem',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgb(var(--color-border) / 0.22)',
  backgroundColor: 'rgb(var(--color-surface) / 0.9)',
};

const titleStyle: CSSProperties = {
  fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)',
  lineHeight: 1.1,
  letterSpacing: '-0.03em',
};

const descriptionStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
};

export default WorkDetailNotFound;
