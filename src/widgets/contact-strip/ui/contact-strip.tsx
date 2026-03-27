import { useTranslations } from 'next-intl';
import { css } from 'styled-system/css';

import {
  CONTACT_EMAIL_ADDRESS,
  CONTACT_GITHUB_URL,
  CONTACT_LINKEDIN_URL,
} from '@/shared/config/contact-links';
import { Button } from '@/shared/ui/button/button';
import { GithubIcon, LinkedInIcon, MailSolidIcon } from '@/shared/ui/icons/app-icons';

/** 홈 contact 영역의 텍스트와 액션을 렌더링합니다. */
export const ContactStrip = () => {
  const t = useTranslations('Contact');

  return (
    <section className={sectionClass}>
      <div className={copyClass}>
        <h2 className={titleClass}>
          <span>{t('titleLine1')}</span>
          <span>{t('titleLine2')}</span>
        </h2>
        <ul className={metaListClass}>
          <li className={metaItemClass}>
            <span className={metaLabelClass}>{'Location'}</span>
            <span>{t('locationValue')}</span>
          </li>
          <li className={metaItemClass}>
            <span className={metaLabelClass}>{'Focus'}</span>
            <span>{t('focusValue')}</span>
          </li>
        </ul>
      </div>
      <div className={actionsClass}>
        <Button
          asChild
          className={actionButtonClass}
          leadingVisual={<MailSolidIcon aria-hidden color="muted" size="md" />}
          size="md"
          tone="white"
          variant="solid"
        >
          <a href={`mailto:${CONTACT_EMAIL_ADDRESS}`}>{'Email'}</a>
        </Button>
        <Button
          asChild
          className={actionButtonClass}
          leadingVisual={<GithubIcon aria-hidden color="muted" size="md" />}
          size="md"
          tone="white"
          variant="solid"
        >
          <a href={CONTACT_GITHUB_URL} rel="noopener noreferrer" target="_blank">
            {'Github'}
          </a>
        </Button>
        <Button
          asChild
          className={actionButtonClass}
          leadingVisual={<LinkedInIcon aria-hidden color="muted" size="md" />}
          size="md"
          tone="white"
          variant="solid"
        >
          <a href={CONTACT_LINKEDIN_URL} rel="noopener noreferrer" target="_blank">
            {'LinkedIn'}
          </a>
        </Button>
      </div>
    </section>
  );
};

const sectionClass = css({
  width: 'full',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '10',
  alignContent: 'center',
});

const copyClass = css({
  display: 'grid',
  gap: '8',
});

const titleClass = css({
  fontSize: '6xl',
  lineHeight: 'none',
  letterSpacing: '[-0.04em]',
  display: 'grid',
  gap: '1',
  '& > span': {
    whiteSpace: 'nowrap',
  },
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
  flexWrap: 'nowrap',
  gap: '3',
  width: 'auto',
});

const actionButtonClass = css({
  transition: '[transform 180ms ease]',
  _hover: {
    transform: 'translateY(-2px)',
    borderColor: 'borderStrong',
  },
  _active: {
    transform: 'translateY(1px)',
  },
});
