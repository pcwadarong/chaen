'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

/** 방명록 소개와 공개 영역 구성을 담당하는 페이지 컨테이너입니다. */
export const GuestPage = () => {
  const t = useTranslations('Guest');

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>{t('eyebrow')}</p>
        <h1 style={titleStyle}>{t('title')}</h1>
        <p style={descriptionStyle}>{t('description')}</p>
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

const eyebrowStyle: CSSProperties = {
  fontSize: '0.82rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgb(var(--color-muted))',
};

const titleStyle: CSSProperties = {
  fontSize: 'clamp(2.4rem, 6vw, 4.8rem)',
  lineHeight: 0.96,
  letterSpacing: '-0.04em',
};

const descriptionStyle: CSSProperties = {
  maxWidth: '52rem',
  color: 'rgb(var(--color-muted))',
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
