import type { CSSProperties } from 'react';

/** 방명록 소개와 공개 영역 구성을 담당하는 페이지 컨테이너입니다. */
export const GuestPage = () => (
  <main style={pageStyle}>
    <section style={heroStyle}>
      <p style={eyebrowStyle}>Guestbook</p>
      <h1 style={titleStyle}>Guest interactions stay lightweight and modal-driven.</h1>
      <p style={descriptionStyle}>
        방명록 입력은 이후 모달 feature로 분리하고, 현재 페이지는 공개 소개와 읽기 경험 중심으로
        둡니다.
      </p>
    </section>
    <section style={panelStyle}>
      <ul style={listStyle}>
        <li>읽기 중심의 공개 메시지 영역</li>
        <li>작성은 추후 `create-guestbook-entry` feature로 분리</li>
        <li>페이지는 데이터 패칭과 조합만 담당</li>
      </ul>
    </section>
  </main>
);

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
  color: 'rgba(23, 23, 23, 0.56)',
};

const titleStyle: CSSProperties = {
  fontSize: 'clamp(2.4rem, 6vw, 4.8rem)',
  lineHeight: 0.96,
  letterSpacing: '-0.04em',
};

const descriptionStyle: CSSProperties = {
  maxWidth: '52rem',
  color: 'rgba(23, 23, 23, 0.72)',
};

const panelStyle: CSSProperties = {
  padding: '1.5rem',
  borderRadius: '1.25rem',
  border: '1px solid rgba(23, 23, 23, 0.08)',
  backgroundColor: 'rgba(255, 255, 255, 0.76)',
};

const listStyle: CSSProperties = {
  paddingLeft: '1rem',
  listStyle: 'disc',
  display: 'grid',
  gap: '0.75rem',
};
