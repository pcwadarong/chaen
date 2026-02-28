import type { CSSProperties } from 'react';

/** 홈 하단 연락 유도 영역입니다. */
export const ContactStrip = () => (
  <section style={sectionStyle}>
    <div style={copyStyle}>
      <p style={eyebrowStyle}>Contact Me</p>
      <h2 style={titleStyle}>A compact closing section with motion.</h2>
      <p style={descriptionStyle}>
        홈 하단에는 짧은 애니메이션과 함께 연락 유도 문구가 들어갈 자리만 먼저 확보합니다.
      </p>
    </div>
    <div aria-hidden="true" style={motionStyle}>
      <span style={pulseStyle} />
      <span style={pulseDelayedStyle} />
    </div>
  </section>
);

const sectionStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(16rem, 20rem)',
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
  color: 'rgb(var(--grayscale-7) / 0.56)',
};

const titleStyle: CSSProperties = {
  fontSize: 'clamp(2rem, 4vw, 3.25rem)',
  lineHeight: 0.96,
  letterSpacing: '-0.04em',
};

const descriptionStyle: CSSProperties = {
  maxWidth: '52rem',
  color: 'rgb(var(--grayscale-7) / 0.72)',
};

const motionStyle: CSSProperties = {
  position: 'relative',
  minHeight: '16rem',
  overflow: 'hidden',
  padding: '1.5rem',
  borderRadius: '1.5rem',
  border: '1px solid rgb(var(--grayscale-7) / 0.08)',
  background:
    'linear-gradient(180deg, rgb(var(--grayscale-1) / 0.88), rgb(var(--grayscale-1) / 0.56)), rgb(var(--grayscale-1) / 0.7)',
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
  background: 'rgb(var(--grayscale-5) / 0.35)',
};

const pulseDelayedStyle: CSSProperties = {
  ...pulseBaseStyle,
  inset: 'auto 16% 18% auto',
  width: '4.5rem',
  height: '4.5rem',
  background: 'rgb(var(--grayscale-7) / 0.18)',
};
