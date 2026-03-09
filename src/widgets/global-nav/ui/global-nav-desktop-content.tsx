'use client';

import { Suspense } from 'react';
import { css, cx } from 'styled-system/css';

import { Link } from '@/i18n/navigation';
import { buttonRecipe } from '@/shared/ui/button/button.recipe';
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
  <div className={contentClass}>
    <nav aria-label={ariaLabel}>
      <ul className={listClass}>
        {navigationItems.map(item => (
          <li key={item.href}>
            <Link
              aria-current={isActiveNavigationItem(pathname, item.href) ? 'page' : undefined}
              className={cx(
                buttonRecipe({
                  size: 'sm',
                  tone: 'white',
                  variant: 'ghost',
                }),
                navLinkClass,
              )}
              href={item.href}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
    <hr aria-hidden className={controlsDividerClass} />
    <div className={controlsClass}>
      <Suspense fallback={<span className={switcherFallbackClass} />}>
        <LocaleSwitcher />
      </Suspense>
      <ThemeSwitcher />
    </div>
  </div>
);

const contentClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '4',
  flexWrap: 'wrap',
  flex: '[1 1 40rem]',
  '@media (max-width: 960px)': {
    display: 'none',
  },
});

const listClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  flexWrap: 'wrap',
});

const navLinkClass = css({
  border: 'none',
  background: 'transparent',
  fontSize: '16',
  letterSpacing: '[0.04em]',
  color: 'text',
  _hover: {
    background: 'transparent',
    color: 'primary',
  },
  _focusVisible: {
    color: 'primary',
  },
  '&[aria-current="page"]': {
    color: 'primary',
  },
});

const controlsClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '1',
  flexWrap: 'wrap',
});

const controlsDividerClass = css({
  width: '[1px]',
  height: '[1.4rem]',
  m: '0',
  border: 'none',
  backgroundColor: '[rgb(var(--color-border) / 0.7)]',
});

const switcherFallbackClass = css({
  display: 'inline-flex',
  width: '[8.5rem]',
  minHeight: '[2.5rem]',
  borderRadius: 'pill',
  border: '[1px solid rgb(var(--color-border) / 0.18)]',
  backgroundColor: '[rgb(var(--color-surface) / 0.5)]',
});
