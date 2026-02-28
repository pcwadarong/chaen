'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

/**
 * 이력서 소개 페이지 컨테이너입니다.
 */
export const ResumePage = () => {
  const t = useTranslations('Resume');

  return (
    <main style={pageStyle}>
      <section style={panelStyle}>
        <h1 style={titleStyle}>{t('title')}</h1>
      </section>
    </main>
  );
};

const pageStyle: CSSProperties = {
  width: 'min(960px, calc(100% - 2rem))',
  margin: '0 auto',
  padding: '3rem 0 5rem',
};

const panelStyle: CSSProperties = {
  padding: '1.75rem',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgb(var(--color-border) / 0.22)',
  backgroundColor: 'rgb(var(--color-surface) / 0.9)',
};

const titleStyle: CSSProperties = {
  fontSize: 'clamp(2.25rem, 5vw, 4rem)',
  lineHeight: 1.02,
  letterSpacing: '-0.04em',
};
