import { css } from '@emotion/react';

/**
 * 아티클이 없을 때 보여주는 fallback 화면입니다.
 */
const ArticleDetailNotFound = () => (
  <main css={pageStyle}>
    <section css={panelStyle}>
      <h1 css={titleStyle}>요청한 기록을 찾을 수 없습니다.</h1>
      <p css={descriptionStyle}>기록 ID를 다시 확인하거나 목록 페이지에서 다시 선택해 주세요.</p>
    </section>
  </main>
);

const pageStyle = css`
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 3rem 0 5rem;
`;

const panelStyle = css`
  display: grid;
  gap: 0.8rem;
  padding: 1.75rem;
  border-radius: var(--radius-lg);
  border: 1px solid rgb(var(--color-border) / 0.22);
  background-color: rgb(var(--color-surface) / 0.9);
`;

const titleStyle = css`
  font-size: clamp(1.6rem, 3.2vw, 2.2rem);
  line-height: 1.1;
  letter-spacing: -0.03em;
`;

const descriptionStyle = css`
  color: rgb(var(--color-muted));
`;

export default ArticleDetailNotFound;
