import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

/** 홈 첫 화면의 모션 히어로 영역입니다. */
export const HomeHeroScene = () => {
  const t = useTranslations('Home');

  return (
    <section style={sectionStyle}>
      <div style={copyStyle}>
        <p style={eyebrowStyle}>{t('eyebrow')}</p>
        <h1 style={titleStyle}>{t('title')}</h1>
        <p style={descriptionStyle}>{t('description')}</p>
      </div>
      <div aria-hidden="true" style={stageStyle}>
        <span style={largeOrbStyle} />
        <span style={smallOrbStyle} />
      </div>
    </section>
  );
};

const sectionStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18rem), 1fr))',
  alignItems: 'center',
  gap: '1.5rem',
  minHeight: '32rem',
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
  fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
  lineHeight: 0.96,
  letterSpacing: '-0.04em',
};

const descriptionStyle: CSSProperties = {
  maxWidth: '52rem',
  color: 'rgb(var(--color-muted))',
};

const stageStyle: CSSProperties = {
  position: 'relative',
  minHeight: '18rem',
  overflow: 'hidden',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgb(var(--color-border) / 0.22)',
  background:
    'radial-gradient(circle at top, rgb(var(--color-primary) / 0.2), transparent 42%), linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted)))',
};

const orbBaseStyle: CSSProperties = {
  position: 'absolute',
  borderRadius: '999px',
  filter: 'blur(2px)',
};

const largeOrbStyle: CSSProperties = {
  ...orbBaseStyle,
  inset: '15% auto auto 18%',
  width: '12rem',
  height: '12rem',
  background:
    'linear-gradient(135deg, rgb(var(--color-primary) / 0.78), rgb(var(--color-surface) / 0.18))',
};

const smallOrbStyle: CSSProperties = {
  ...orbBaseStyle,
  inset: 'auto 18% 15% auto',
  width: '7rem',
  height: '7rem',
  background:
    'linear-gradient(135deg, rgb(var(--color-text) / 0.55), rgb(var(--color-surface) / 0.18))',
};
