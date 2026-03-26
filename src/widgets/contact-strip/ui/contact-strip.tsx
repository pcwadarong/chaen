import { useTranslations } from 'next-intl';
import { css, cx } from 'styled-system/css';

import { Button } from '@/shared/ui/button/button';
import { GithubIcon, SendIcon } from '@/shared/ui/icons/app-icons';

type ContactStripVariant = 'actions-only' | 'desktop';

type ContactStripProps = Readonly<{
  className?: string;
  variant?: ContactStripVariant;
}>;

/** 홈 contact 영역의 텍스트와 액션을 variant별로 렌더링합니다. */
export const ContactStrip = ({ className, variant = 'desktop' }: ContactStripProps) => {
  const t = useTranslations('Contact');
  const isActionsOnly = variant === 'actions-only';

  return (
    <section
      className={cx(
        sectionClass,
        isActionsOnly ? actionsOnlySectionClass : desktopSectionClass,
        className,
      )}
    >
      {isActionsOnly ? null : (
        <div className={copyClass}>
          <h2 className={titleClass}>
            <span>{t('titleLine1')}</span>
            <span>{t('titleLine2')}</span>
          </h2>
          <ul className={metaListClass}>
            <li className={metaItemClass}>
              <span className={metaLabelClass}>{t('locationLabel')}</span>
              <span>{t('locationValue')}</span>
            </li>
            <li className={metaItemClass}>
              <span className={metaLabelClass}>{t('focusLabel')}</span>
              <span>{t('focusValue')}</span>
            </li>
          </ul>
        </div>
      )}
      <div className={actionsClass}>
        <Button asChild size={isActionsOnly ? 'md' : 'sm'} tone="white" variant="solid">
          <a href={`mailto:${t('emailValue')}`}>
            <SendIcon aria-hidden size="md" />
            {t('emailLabel')}
          </a>
        </Button>
        <Button asChild size={isActionsOnly ? 'md' : 'sm'} tone="white" variant="ghost">
          <a href={t('githubValue')} rel="noopener noreferrer" target="_blank">
            <GithubIcon aria-hidden size="md" />
            {t('githubLabel')}
          </a>
        </Button>
      </div>
    </section>
  );
};

const sectionClass = css({
  width: 'full',
  maxWidth: 'contentWide',
  boxSizing: 'border-box',
  mx: 'auto',
  display: 'grid',
  gap: '4',
  px: '4',
});

const desktopSectionClass = css({
  minHeight: '[clamp(22rem, 50svh, 36rem)]',
  alignContent: 'center',
  pt: '12',
  pb: '20',
});

const actionsOnlySectionClass = css({
  minHeight: 'auto',
  justifyItems: 'stretch',
  py: '6',
});

const copyClass = css({
  display: 'grid',
  gap: '3',
});

const titleClass = css({
  fontSize: '[clamp(2.2rem, 5vw, 4.4rem)]',
  lineHeight: 'none',
  letterSpacing: '[-0.04em]',
  display: 'grid',
  gap: '1',
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

const actionsClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',
});
