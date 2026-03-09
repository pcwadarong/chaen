import { useTranslations } from 'next-intl';
import { css, cx } from 'styled-system/css';

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
      <div aria-hidden="true" className={motionClass}>
        <span className={cx(pulseBaseClass, pulseClass)} />
        <span className={cx(pulseBaseClass, pulseDelayedClass)} />
      </div>
    </section>
  );
};

const sectionClass = css({
  width: '[min(1120px, 100%)]',
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
  lineHeight: '98',
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

const motionClass = css({
  position: 'relative',
  flex: '[1 1 18rem]',
  minHeight: '[16rem]',
  overflow: 'hidden',
  p: '6',
  borderRadius: 'lg',
  border: '[1px solid rgb(var(--color-border) / 0.22)]',
  background:
    '[linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted))), rgb(var(--color-surface))]',
});

const pulseBaseClass = css({
  position: 'absolute',
  borderRadius: 'pill',
});

const pulseClass = css({
  inset: '[22% auto auto 18%]',
  width: '[7rem]',
  height: '[7rem]',
  background: '[rgb(var(--color-primary) / 0.35)]',
});

const pulseDelayedClass = css({
  inset: '[auto 16% 18% auto]',
  width: '[4.5rem]',
  height: '[4.5rem]',
  background: '[rgb(var(--color-text) / 0.18)]',
});
