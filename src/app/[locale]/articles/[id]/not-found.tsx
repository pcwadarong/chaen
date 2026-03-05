import { css } from '@emotion/react';
import { getTranslations } from 'next-intl/server';

/**
 * 아티클이 없을 때 보여주는 fallback 화면입니다.
 */
const ArticleDetailNotFound = async () => {
  const t = await getTranslations('ArticleDetail');

  return (
    <main css={pageStyle}>
      <section css={panelStyle}>
        <h1 css={titleStyle}>{t('notFoundTitle')}</h1>
        <p css={descriptionStyle}>{t('notFoundDescription')}</p>
      </section>
    </main>
  );
};

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
