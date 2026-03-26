'use client';

import { useTranslations } from 'next-intl';
import { css } from 'styled-system/css';

import { Button } from '@/shared/ui/button/button';

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
    <main className={pageClass}>
      <section className={panelClass} role="alert">
        <h1 className={titleClass}>{t('errorTitle')}</h1>
        <p className={descriptionClass}>{error.message}</p>
        <Button className={buttonClass} onClick={reset} tone="white" type="button" variant="solid">
          {t('retry')}
        </Button>
      </section>
    </main>
  );
};

const pageClass = css({
  width: 'full',
  maxWidth: 'contentWide',
  boxSizing: 'border-box',
  mx: 'auto',
  px: '4',
  pt: '12',
  pb: '20',
});

const panelClass = css({
  display: 'grid',
  gap: '3',
  p: '7',
  borderRadius: 'lg',
  border: '[1px solid var(--colors-border)]',
  backgroundColor: 'surface',
});

const titleClass = css({
  fontSize: '[clamp(1.6rem, 3.2vw, 2.2rem)]',
  lineHeight: 'tight',
  letterSpacing: '[-0.03em]',
});

const descriptionClass = css({
  color: 'muted',
});

const buttonClass = css({
  width: '[fit-content]',
  py: '0',
});

export default ProjectDetailError;
