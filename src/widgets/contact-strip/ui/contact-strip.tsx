import { useTranslations } from 'next-intl';
import { css } from 'styled-system/css';

/** 홈 하단 연락 유도 영역입니다. */
export const ContactStrip = () => {
  const t = useTranslations('Contact');

  return (
    <section className={sectionClass}>
      <div className={copyClass}>
        <h2 className={titleClass}>{t('title')}</h2>
        <ul className={metaListClass}>
          <li className={metaItemClass}>
            <span className={metaLabelClass}>{t('locationLabel')}</span>
            <span>{t('locationValue')}</span>
          </li>
          <li className={metaItemClass}>
            <span className={metaLabelClass}>{t('focusLabel')}</span>
            <span>{t('focusValue')}</span>
          </li>
          <li className={metaItemClass}>
            <span className={metaLabelClass}>{t('githubLabel')}</span>
            <a
              className={linkClass}
              href={t('githubValue')}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t('githubValue')}
            </a>
          </li>
          <li className={metaItemClass}>
            <span className={metaLabelClass}>{t('emailLabel')}</span>
            <a className={linkClass} href={`mailto:${t('emailValue')}`}>
              {t('emailValue')}
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
};

const sectionClass = css({
  width: 'full',
  maxWidth: 'contentWide',
  boxSizing: 'border-box',
  mx: 'auto',
  minHeight: '[clamp(22rem, 50svh, 36rem)]',
  display: 'flex',
  alignItems: 'stretch',
  flexWrap: 'wrap',
  gap: '4',
  px: '4',
  pt: '12',
  pb: '20',
});

const copyClass = css({
  display: 'grid',
  alignContent: 'center',
  gap: '3',
  flex: '[1 1 22rem]',
});

const titleClass = css({
  fontSize: '[clamp(2.2rem, 5vw, 4.4rem)]',
  lineHeight: 'none',
  letterSpacing: '[-0.04em]',
});

const metaListClass = css({
  display: 'grid',
  gap: '2',
  color: 'muted',
});

const metaItemClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

const metaLabelClass = css({
  fontWeight: 'bold',
});

const linkClass = css({
  textDecoration: 'underline',
});
