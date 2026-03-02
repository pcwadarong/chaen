'use client';

import type { CSSProperties } from 'react';

type WorkDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * 프로젝트 상세 페이지 에러 UI입니다.
 */
const WorkDetailError = ({ error, reset }: WorkDetailErrorProps) => (
  <main style={pageStyle}>
    <section role="alert" style={panelStyle}>
      <h1 style={titleStyle}>프로젝트를 불러오는 중 문제가 발생했습니다.</h1>
      <p style={descriptionStyle}>{error.message}</p>
      <button onClick={reset} style={buttonStyle} type="button">
        다시 시도
      </button>
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
  border: '1px solid rgb(var(--color-border) / 0.3)',
  backgroundColor: 'rgb(var(--color-surface) / 0.92)',
};

const titleStyle: CSSProperties = {
  fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)',
  lineHeight: 1.1,
  letterSpacing: '-0.03em',
};

const descriptionStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
};

const buttonStyle: CSSProperties = {
  width: 'fit-content',
  minHeight: '2.7rem',
  padding: '0 1rem',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid rgb(var(--color-border) / 0.3)',
  backgroundColor: 'rgb(var(--color-surface) / 0.95)',
};

export default WorkDetailError;
