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
  layout?: 'centered' | 'split';
}>;

/** 홈 contact 영역의 텍스트와 액션을 렌더링합니다. */
export const ContactStrip = ({ layout = 'split' }: ContactStripProps) => {
  const t = useTranslations('Contact');
  const isCentered = layout === 'centered';
  const title = t('title');
  const titleLines = title
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  const accessibleTitle = titleLines.join(' ');

  return (
    <section className={cx(sectionClass, isCentered && centeredSectionClass)}>
      <div className={cx(copyClass, isCentered && centeredCopyClass)}>
        <h2 className={cx(titleClass, isCentered && centeredTitleClass)}>
          <span className={srOnlyClass}>{accessibleTitle}</span>
          <span aria-hidden="true" className={titleVisualLinesClass}>
            {titleLines.map((line, index) => (
              <span key={`${line}-${index}`}>{line}</span>
            ))}
          </span>
        </h2>
        <ul className={cx(metaListClass, isCentered && centeredMetaListClass)}>
          <li className={cx(metaItemClass, isCentered && centeredMetaItemClass)}>
            <span className={metaLabelClass}>{t('locationLabel')}</span>
            <span>{t('locationValue')}</span>
          </li>
          <li className={cx(metaItemClass, isCentered && centeredMetaItemClass)}>
            <span className={metaLabelClass}>{t('focusLabel')}</span>
            <span>{t('focusValue')}</span>
          </li>
        </ul>
      </div>
      <div className={cx(actionsClass, isCentered && centeredActionsClass)}>
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

const centeredSectionClass = css({
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  gap: '7',
});

const copyClass = css({
  display: 'grid',
  gap: '8',
});

const centeredCopyClass = css({
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

const centeredTitleClass = css({
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

const centeredMetaListClass = css({
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

const centeredMetaItemClass = css({
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

const centeredActionsClass = css({
  justifyContent: 'center',
  flexWrap: 'wrap',
});

// 미세한 버튼 반동은 토큰보다 실제 px 이동이 더 안정적으로 느껴져 예외적으로 유지합니다.
// 추후 interaction spacing token이 생기면 그때 토큰 기반으로 옮깁니다.
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
