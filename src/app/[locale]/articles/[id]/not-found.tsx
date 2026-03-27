import { useTranslations } from 'next-intl';
import { css } from 'styled-system/css';

/**
 * 아티클이 없을 때 보여주는 fallback 화면입니다.
 */
const ArticleDetailNotFound = () => {
  const t = useTranslations('ArticleDetail');

  return (
    <main className={pageClass}>
      <section className={panelClass}>
        <h1 className={titleClass}>{t('notFoundTitle')}</h1>
        <p className={descriptionClass}>{t('notFoundDescription')}</p>
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

export default ArticleDetailNotFound;
