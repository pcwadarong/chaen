'use client';

import { css } from '@emotion/react';
import { useTranslations } from 'next-intl';

/**
 * 프로젝트가 없을 때 보여주는 fallback 화면입니다.
 */
const ProjectDetailNotFound = () => {
  const t = useTranslations('ProjectDetail');

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
  padding: var(--space-12) var(--space-0) var(--space-20);
`;

const panelStyle = css`
  display: grid;
  gap: var(--space-3);
  padding: var(--space-7);
  border-radius: var(--radius-lg);
  border: 1px solid rgb(var(--color-border) / 0.22);
  background-color: rgb(var(--color-surface) / 0.9);
`;

const titleStyle = css`
  font-size: clamp(1.6rem, 3.2vw, 2.2rem);
  line-height: var(--line-height-110);
  letter-spacing: -0.03em;
`;

const descriptionStyle = css`
  color: rgb(var(--color-muted));
`;

export default ProjectDetailNotFound;
