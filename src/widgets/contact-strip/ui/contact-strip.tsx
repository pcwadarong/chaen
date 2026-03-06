'use client';

import { css } from '@emotion/react';
import { useTranslations } from 'next-intl';

/** 홈 하단 연락 유도 영역입니다. */
export const ContactStrip = () => {
  const t = useTranslations('Contact');

  return (
    <section css={sectionStyle}>
      <div css={copyStyle}>
        <h2 css={titleStyle}>{t('title')}</h2>
        <ul css={metaListStyle}>
          <li css={metaItemStyle}>
            <span css={metaLabelStyle}>{t('locationLabel')}</span>
            <span>{t('locationValue')}</span>
          </li>
          <li css={metaItemStyle}>
            <span css={metaLabelStyle}>{t('focusLabel')}</span>
            <span>{t('focusValue')}</span>
          </li>
          <li css={metaItemStyle}>
            <span css={metaLabelStyle}>{t('githubLabel')}</span>
            <a
              href={t('githubValue')}
              target="_blank"
              rel="noopener noreferrer"
              css={emailLinkStyle}
            >
              {t('githubValue')}
            </a>
          </li>
          <li css={metaItemStyle}>
            <span css={metaLabelStyle}>{t('emailLabel')}</span>
            <a href={`mailto:${t('emailValue')}`} css={emailLinkStyle}>
              {t('emailValue')}
            </a>
          </li>
        </ul>
      </div>
      <div aria-hidden="true" css={motionStyle}>
        <span css={pulseStyle} />
        <span css={pulseDelayedStyle} />
      </div>
    </section>
  );
};

const sectionStyle = css`
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  min-height: clamp(22rem, 50svh, 36rem);
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
  gap: var(--space-4);
  padding: var(--space-12) var(--space-0) var(--space-20);
`;

const copyStyle = css`
  display: grid;
  align-content: center;
  gap: var(--space-3);
  flex: 1 1 22rem;
`;

const titleStyle = css`
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: var(--line-height-96);
  letter-spacing: -0.04em;
`;

const metaListStyle = css`
  display: grid;
  gap: var(--space-2);
  color: rgb(var(--color-muted));
`;

const metaItemStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const metaLabelStyle = css`
  font-weight: var(--font-weight-bold);
`;

const emailLinkStyle = css`
  text-decoration: underline;
`;

const motionStyle = css`
  position: relative;
  flex: 1 1 18rem;
  min-height: 16rem;
  overflow: hidden;
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid rgb(var(--color-border) / 0.22);
  background:
    linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted))),
    rgb(var(--color-surface));
`;

const pulseBaseStyle = css`
  position: absolute;
  border-radius: var(--radius-pill);
`;

const pulseStyle = css`
  ${pulseBaseStyle};
  inset: 22% auto auto 18%;
  width: 7rem;
  height: 7rem;
  background: rgb(var(--color-primary) / 0.35);
`;

const pulseDelayedStyle = css`
  ${pulseBaseStyle};
  inset: auto 16% 18% auto;
  width: 4.5rem;
  height: 4.5rem;
  background: rgb(var(--color-text) / 0.18);
`;
