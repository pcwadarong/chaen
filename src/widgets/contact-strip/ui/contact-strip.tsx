import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

/** 홈 하단 연락 유도 영역입니다. */
export const ContactStrip = () => {
  const t = useTranslations('Contact');

  return (
    <section style={sectionStyle}>
      <div style={copyStyle}>
        <p style={eyebrowStyle}>{t('eyebrow')}</p>
        <h2 style={titleStyle}>{t('title')}</h2>
        <p style={descriptionStyle}>{t('description')}</p>
      </div>
      <div aria-hidden="true" style={motionStyle}>
        <span style={pulseStyle} />
        <span style={pulseDelayedStyle} />
      </div>
    </section>
  );
};

const sectionStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))',
  alignItems: 'center',
  gap: '1rem',
};

const copyStyle: CSSProperties = {
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
  fontSize: 'clamp(2rem, 4vw, 3.25rem)',
  lineHeight: 0.96,
  letterSpacing: '-0.04em',
};

const descriptionStyle: CSSProperties = {
  maxWidth: '52rem',
  color: 'rgb(var(--color-muted))',
};

const motionStyle: CSSProperties = {
  position: 'relative',
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
