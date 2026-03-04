'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

/** 방명록 소개와 공개 영역 구성을 담당하는 페이지 컨테이너입니다. */
export const GuestPage = () => {
  const t = useTranslations('Guest');

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <h1 style={titleStyle}>{t('title')}</h1>
        <p style={srOnlyStyle}>{t('description')}</p>
      </section>
      <section style={panelStyle}>
        <ul style={listStyle}>
          <li>{t('item1')}</li>
          <li>{t('item2')}</li>
          <li>{t('item3')}</li>
        </ul>
      </section>
    </main>
  );
};

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

const titleStyle: CSSProperties = {
  fontSize: 'clamp(2.4rem, 6vw, 4.8rem)',
  lineHeight: 0.96,
  letterSpacing: '-0.04em',
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

const panelStyle: CSSProperties = {
  padding: '1.5rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid rgb(var(--color-border) / 0.22)',
  backgroundColor: 'rgb(var(--color-surface) / 0.86)',
};

const listStyle: CSSProperties = {
  paddingLeft: '1rem',
  listStyle: 'disc',
  display: 'grid',
  gap: '0.75rem',
};
