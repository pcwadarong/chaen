'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

/** 홈 하단 연락 유도 영역입니다. */
export const ContactStrip = () => {
  const t = useTranslations('Contact');

  return (
    <section style={sectionStyle}>
      <div style={copyStyle}>
        <h2 style={titleStyle}>{t('title')}</h2>
        <ul style={metaListStyle}>
          <li style={metaItemStyle}>
            <span style={metaLabelStyle}>{t('locationLabel')}</span>
            <span>{t('locationValue')}</span>
          </li>
          <li style={metaItemStyle}>
            <span style={metaLabelStyle}>{t('focusLabel')}</span>
            <span>{t('focusValue')}</span>
          </li>
          <li style={metaItemStyle}>
            <span style={metaLabelStyle}>{t('emailLabel')}</span>
            <a href={`mailto:${t('emailValue')}`} style={emailLinkStyle}>
              {t('emailValue')}
            </a>
          </li>
        </ul>
      </div>
      <div aria-hidden="true" style={motionStyle}>
        <span style={pulseStyle} />
        <span style={pulseDelayedStyle} />
      </div>
    </section>
  );
};

const sectionStyle: CSSProperties = {
  width: 'min(1120px, calc(100% - 2rem))',
  margin: '0 auto',
  minHeight: 'clamp(22rem, 50svh, 36rem)',
  display: 'flex',
  alignItems: 'stretch',
  flexWrap: 'wrap',
  gap: '1rem',
  padding: '3rem 0 5rem',
};

const copyStyle: CSSProperties = {
  display: 'grid',
  alignContent: 'center',
  gap: '0.75rem',
  flex: '1 1 22rem',
};

const titleStyle: CSSProperties = {
  fontSize: 'clamp(2rem, 4vw, 3.25rem)',
  lineHeight: 0.96,
  letterSpacing: '-0.04em',
};

const metaListStyle: CSSProperties = {
  display: 'grid',
  gap: '0.45rem',
  color: 'rgb(var(--color-muted))',
};

const metaItemStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.45rem',
};

const metaLabelStyle: CSSProperties = {
  fontWeight: 700,
};

const emailLinkStyle: CSSProperties = {
  textDecoration: 'underline',
};

const motionStyle: CSSProperties = {
  position: 'relative',
  flex: '1 1 18rem',
  minHeight: '16rem',
  overflow: 'hidden',
  padding: '1.5rem',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgb(var(--color-border) / 0.22)',
  background:
    'linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted))), rgb(var(--color-surface))',
};

const pulseBaseStyle: CSSProperties = {
  position: 'absolute',
  borderRadius: '999px',
};

const pulseStyle: CSSProperties = {
  ...pulseBaseStyle,
  inset: '22% auto auto 18%',
  width: '7rem',
  height: '7rem',
  background: 'rgb(var(--color-primary) / 0.35)',
};

const pulseDelayedStyle: CSSProperties = {
  ...pulseBaseStyle,
  inset: 'auto 16% 18% auto',
  width: '4.5rem',
  height: '4.5rem',
  background: 'rgb(var(--color-text) / 0.18)',
};
