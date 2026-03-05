import { css } from '@emotion/react';
import { getTranslations } from 'next-intl/server';

/**
 * 프로젝트 상세 로딩 상태 UI입니다.
 */
const WorkDetailLoading = async () => {
  const t = await getTranslations('WorkDetail');

  return (
    <main css={pageStyle}>
      <section aria-busy="true" aria-label={t('loading')} aria-live="polite" css={panelStyle}>
        <div css={lineLgStyle} />
        <div css={lineMdStyle} />
        <div css={lineSmStyle} />
      </section>
    </main>
  );
};

const pageStyle = css`
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  padding: var(--space-12) var(--space-0) var(--space-20);
`;

const panelStyle = css`
  display: grid;
  gap: var(--space-3);
  padding: var(--space-7);
  border-radius: var(--radius-lg);
  border: 1px solid rgb(var(--color-border) / 0.2);
  background-color: rgb(var(--color-surface) / 0.9);
`;

const lineBaseStyle = css`
  height: 1rem;
  border-radius: var(--radius-pill);
  background-color: rgb(var(--color-surface-muted));
`;

const lineLgStyle = css`
  ${lineBaseStyle};
  width: 62%;
`;

const lineMdStyle = css`
  ${lineBaseStyle};
  width: 82%;
`;

const lineSmStyle = css`
  ${lineBaseStyle};
  width: 45%;
`;

export default WorkDetailLoading;
