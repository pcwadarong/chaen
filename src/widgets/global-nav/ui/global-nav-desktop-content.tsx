'use client';

import { css } from '@emotion/react';
import { Suspense } from 'react';

import { Link } from '@/i18n/navigation';
import { getButtonStyle } from '@/shared/ui/button/button';
import { isActiveNavigationItem } from '@/widgets/global-nav/model/is-active-navigation-item';
import type { GlobalNavItem } from '@/widgets/global-nav/model/navigation-item';
import { LocaleSwitcher } from '@/widgets/global-nav/ui/locale-switcher';
import { ThemeSwitcher } from '@/widgets/global-nav/ui/theme-switcher';

type GlobalNavDesktopContentProps = {
  ariaLabel: string;
  navigationItems: readonly GlobalNavItem[];
  pathname: string;
};

/** 데스크톱 뷰에서 사용하는 전역 내비게이션 링크/스위처 영역입니다. */
export const GlobalNavDesktopContent = ({
  ariaLabel,
  navigationItems,
  pathname,
}: GlobalNavDesktopContentProps) => (
  <div css={contentStyle}>
    <nav aria-label={ariaLabel}>
      <ul css={listStyle}>
        {navigationItems.map(item => (
          <li key={item.href}>
            <Link
              aria-current={isActiveNavigationItem(pathname, item.href) ? 'page' : undefined}
              href={item.href}
              css={navLinkStyle}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
    <hr aria-hidden css={controlsDividerStyle} />
    <div css={controlsStyle}>
      <Suspense fallback={<span css={switcherFallbackStyle} />}>
        <LocaleSwitcher />
      </Suspense>
      <ThemeSwitcher />
    </div>
  </div>
);

const contentStyle = css`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-4);
  flex-wrap: wrap;
  flex: 1 1 40rem;

  @media (max-width: 960px) {
    display: none;
  }
`;

const listStyle = css`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-wrap: wrap;
`;

const navLinkStyle = css`
  ${getButtonStyle({
    size: 'sm',
    tone: 'white',
    variant: 'ghost',
  })};
  border: none;
  background: transparent;
  font-size: var(--font-size-16);
  letter-spacing: 0.04em;
  color: rgb(var(--color-text));

  &:hover:not(:disabled):not([aria-disabled='true']) {
    background: transparent;
    color: rgb(var(--color-primary));
  }

  &:focus-visible {
    color: rgb(var(--color-primary));
    box-shadow: 0 0 0 3px rgb(var(--color-primary) / 0.18);
  }

  &[aria-current='page'] {
    color: rgb(var(--color-primary));
  }
`;

const controlsStyle = css`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-1);
  flex-wrap: wrap;
`;

const controlsDividerStyle = css`
  width: 1px;
  height: 1.4rem;
  margin: 0;
  border: 0;
  background-color: rgb(var(--color-border) / 0.7);
`;

const switcherFallbackStyle = css`
  display: inline-flex;
  width: 8.5rem;
  min-height: 2.5rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--color-border) / 0.18);
  background-color: rgb(var(--color-surface) / 0.5);
`;
