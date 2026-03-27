import React from 'react';
import { css } from 'styled-system/css';

import {
  CONTACT_EMAIL_ADDRESS,
  CONTACT_GITHUB_URL,
  CONTACT_LINKEDIN_URL,
} from '@/shared/config/contact-links';
import { GithubIcon, LinkedInIcon, MailSolidIcon } from '@/shared/ui/icons/app-icons';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';
import { HOME_HERO_STAGE_BACKGROUND } from '@/widgets/home-hero-scene/model/home-hero-scene-theme';

const mobileContactLinks = [
  {
    ariaLabel: 'Email',
    href: `mailto:${CONTACT_EMAIL_ADDRESS}`,
    icon: <MailSolidIcon aria-hidden customColor={HOME_HERO_STAGE_BACKGROUND} size={30} />,
  },
  {
    ariaLabel: 'GitHub',
    href: CONTACT_GITHUB_URL,
    icon: <GithubIcon aria-hidden customColor={HOME_HERO_STAGE_BACKGROUND} size={36} />,
  },
  {
    ariaLabel: 'LinkedIn',
    href: CONTACT_LINKEDIN_URL,
    icon: <LinkedInIcon aria-hidden customColor={HOME_HERO_STAGE_BACKGROUND} size={42} />,
  },
] as const;

/** 모바일 홈 히어로 우상단에 고정되는 contact 버튼 묶음입니다. */
export const HomeHeroContactButtons = () => (
  <nav aria-label="Contact links" className={wrapperClass}>
    {mobileContactLinks.map(link => (
      <a
        className={iconButtonClass}
        href={link.href}
        key={link.ariaLabel}
        rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
        target={link.href.startsWith('http') ? '_blank' : undefined}
      >
        <span aria-hidden className={iconClass}>
          {link.icon}
        </span>
        <span className={srOnlyClass}>{link.ariaLabel}</span>
      </a>
    ))}
  </nav>
);

const wrapperClass = css({
  position: 'absolute',
  top: '[calc(var(--global-nav-height) + env(safe-area-inset-top))]',
  right: '[max(2rem, env(safe-area-inset-right))]',
  zIndex: '5',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '5',
  _desktopUp: {
    display: 'none',
  },
});

const iconButtonClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSize: '[3rem]',
  borderRadius: 'full',
  backgroundColor: 'surface',
  focusVisibleRing: 'outside',
  _hover: {
    transform: 'translateY(-2px)',
    boxShadow: 'floating',
  },
  _focusVisible: {
    boxShadow: 'floating',
  },
  _active: {
    transform: 'translateY(1px)',
  },
});

const iconClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 'none',
});
