import { useTranslations } from 'next-intl';
import { css, cx } from 'styled-system/css';

import {
  CONTACT_EMAIL_ADDRESS,
  CONTACT_GITHUB_URL,
  CONTACT_LINKEDIN_URL,
} from '@/shared/config/contact-links';
import { Button } from '@/shared/ui/button/button';
import { GithubIcon, LinkedInIcon, MailSolidIcon } from '@/shared/ui/icons/app-icons';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

type ContactStripProps = Readonly<{
  layout?: 'compact' | 'default';
}>;

/** 홈 contact 영역의 텍스트와 액션을 렌더링합니다. */
export const ContactStrip = ({ layout = 'default' }: ContactStripProps) => {
  const t = useTranslations('Contact');
  const isCompact = layout === 'compact';
  const title = t('title');
  const titleLines = title
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  const accessibleTitle = titleLines.join(' ');

  return (
    <section className={cx(sectionClass, isCompact && compactSectionClass)}>
      <div className={cx(copyClass, isCompact && compactCopyClass)}>
        <h2 className={cx(titleClass, isCompact && compactTitleClass)}>
          <span className={srOnlyClass}>{accessibleTitle}</span>
          <span aria-hidden="true" className={titleVisualLinesClass}>
            {titleLines.map(line => (
              <span key={line}>{line}</span>
            ))}
          </span>
        </h2>
        <ul className={cx(metaListClass, isCompact && compactMetaListClass)}>
          <li className={cx(metaItemClass, isCompact && compactMetaItemClass)}>
            <span className={metaLabelClass}>{'Location'}</span>
            <span>{t('locationValue')}</span>
          </li>
          <li className={cx(metaItemClass, isCompact && compactMetaItemClass)}>
            <span className={metaLabelClass}>{'Focus'}</span>
            <span>{t('focusValue')}</span>
          </li>
        </ul>
      </div>
      <div className={cx(actionsClass, isCompact && compactActionsClass)}>
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

const compactSectionClass = css({
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  gap: '7',
});

const copyClass = css({
  display: 'grid',
  gap: '8',
});

const compactCopyClass = css({
  justifyItems: 'center',
  gap: '5',
});

const titleClass = css({
  fontSize: '6xl',
  lineHeight: 'none',
  letterSpacing: '[-0.04em]',
});

const titleVisualLinesClass = css({
  display: 'grid',
  gap: '1',
  '& > span': {
    whiteSpace: 'nowrap',
  },
});

const compactTitleClass = css({
  fontSize: '5xl',
  textAlign: 'center',
  '& [aria-hidden="true"]': {
    justifyItems: 'center',
  },
  '& [aria-hidden="true"] > span': {
    whiteSpace: 'normal',
  },
});

const metaListClass = css({
  display: 'grid',
  gap: '2',
  color: 'muted',
});

const compactMetaListClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  columnGap: '5',
  rowGap: '2',
});

const metaItemClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

const compactMetaItemClass = css({
  whiteSpace: 'nowrap',
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

const compactActionsClass = css({
  justifyContent: 'center',
  flexWrap: 'wrap',
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
