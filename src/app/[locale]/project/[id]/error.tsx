'use client';

import { css } from '@emotion/react';
import { useTranslations } from 'next-intl';

type ProjectDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * 프로젝트 상세 페이지 에러 UI입니다.
 */
const ProjectDetailError = ({ error, reset }: ProjectDetailErrorProps) => {
  const t = useTranslations('ProjectDetail');

  return (
    <main css={pageStyle}>
      <section role="alert" css={panelStyle}>
        <h1 css={titleStyle}>{t('errorTitle')}</h1>
        <p css={descriptionStyle}>{error.message}</p>
        <button onClick={reset} css={buttonStyle} type="button">
          {t('retry')}
        </button>
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
  border: 1px solid rgb(var(--color-border) / 0.3);
  background-color: rgb(var(--color-surface) / 0.92);
`;

const titleStyle = css`
  font-size: clamp(1.6rem, 3.2vw, 2.2rem);
  line-height: var(--line-height-110);
  letter-spacing: -0.03em;
`;

const descriptionStyle = css`
  color: rgb(var(--color-muted));
`;

const buttonStyle = css`
  width: fit-content;
  min-height: 2.7rem;
  padding: var(--space-0) var(--space-4);
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--color-border) / 0.3);
  background-color: rgb(var(--color-surface) / 0.95);
`;

export default ProjectDetailError;
