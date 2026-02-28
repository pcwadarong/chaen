import type { CSSProperties } from 'react';

/** 홈 첫 화면의 모션 히어로 영역입니다. */
export const HomeHeroScene = () => (
  <section style={sectionStyle}>
    <div style={copyStyle}>
      <p style={eyebrowStyle}>Home</p>
      <h1 style={titleStyle}>A single-page opening with room for motion.</h1>
      <p style={descriptionStyle}>
        첫 화면은 Three.js 애니메이션이 주도하고, 그 아래에서 프로젝트와 연락 섹션이 이어지는 구조를
        염두에 둔 홈 컨테이너입니다.
      </p>
    </div>
    <div aria-hidden="true" style={stageStyle}>
      <span style={largeOrbStyle} />
      <span style={smallOrbStyle} />
    </div>
  </section>
);

const sectionStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(16rem, 24rem)',
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
  color: 'rgba(23, 23, 23, 0.56)',
};

const titleStyle: CSSProperties = {
  fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
  lineHeight: 0.96,
  letterSpacing: '-0.04em',
};

const descriptionStyle: CSSProperties = {
  maxWidth: '52rem',
  color: 'rgba(23, 23, 23, 0.72)',
};

const stageStyle: CSSProperties = {
  position: 'relative',
  minHeight: '18rem',
  overflow: 'hidden',
  borderRadius: '2rem',
  border: '1px solid rgba(23, 23, 23, 0.08)',
  background:
    'radial-gradient(circle at top, rgba(255, 255, 255, 0.88), transparent 45%), linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.56))',
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
  background: 'linear-gradient(135deg, rgba(255, 140, 92, 0.78), rgba(255, 255, 255, 0.2))',
};

const smallOrbStyle: CSSProperties = {
  ...orbBaseStyle,
  inset: 'auto 18% 15% auto',
  width: '7rem',
  height: '7rem',
  background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.55), rgba(255, 255, 255, 0.18))',
};
