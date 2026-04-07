import Link from 'next/link';
import React, { Suspense } from 'react';
import { css } from 'styled-system/css';

import { Link as LocalizedLink } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button/button';
import { isActiveNavigationItem } from '@/widgets/global-nav/ui/is-active-navigation-item';
import { LocaleSwitcher } from '@/widgets/global-nav/ui/locale-switcher';
import { MusicToggleButton } from '@/widgets/global-nav/ui/music-toggle-button';
import type { GlobalNavItem } from '@/widgets/global-nav/ui/navigation-item';
import { ThemeSwitcher } from '@/widgets/global-nav/ui/theme-switcher';

type GlobalNavDesktopContentProps = {
  ariaLabel: string;
  navigationItems: readonly GlobalNavItem[];
  pathname: string;
  showLocaleSwitcher?: boolean;
};

/** 데스크톱 뷰에서 사용하는 전역 내비게이션 링크/스위처 영역입니다. */
const GlobalNavDesktopContentBase = ({
  ariaLabel,
  navigationItems,
  pathname,
  showLocaleSwitcher = true,
}: GlobalNavDesktopContentProps) => (
  <div className={contentClass}>
    <nav aria-label={ariaLabel}>
      <ul className={listClass}>
        {navigationItems.map(item => (
          <li key={item.href}>
            <Button
              asChild
              className={navLinkClass}
              size="sm"
              tone="white"
              type={undefined}
              variant="ghost"
            >
              {item.href === '/admin' ? (
                <Link
                  aria-current={isActiveNavigationItem(pathname, item.href) ? 'page' : undefined}
                  href={item.href}
                  prefetch
                >
                  {item.label}
                </Link>
              ) : (
                <LocalizedLink
                  aria-current={isActiveNavigationItem(pathname, item.href) ? 'page' : undefined}
                  href={item.href}
                  prefetch
                >
                  {item.label}
                </LocalizedLink>
              )}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
    <hr aria-hidden className={controlsDividerClass} />
    <div className={controlsClass}>
      <MusicToggleButton />
      {showLocaleSwitcher ? (
        <Suspense fallback={<span className={switcherFallbackClass} />}>
          <LocaleSwitcher />
        </Suspense>
      ) : null}
      <ThemeSwitcher />
    </div>
  </div>
);

GlobalNavDesktopContentBase.displayName = 'GlobalNavDesktopContent';

export const GlobalNavDesktopContent = React.memo(GlobalNavDesktopContentBase);

const contentClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '4',
  flexWrap: 'wrap',
  flex: '[1 1 40rem]',
  _tabletDown: {
    display: 'none',
  },
});

const listClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  flexWrap: 'wrap',
});

const navLinkClass = css({
  fontSize: 'md',
  letterSpacing: '[0.04em]',
  _hover: {
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
  backgroundColor: 'border',
});

const switcherFallbackClass = css({
  display: 'inline-flex',
  width: '[8.5rem]',
  minHeight: '[2.5rem]',
  borderRadius: 'full',
  border: '[1px solid var(--colors-border)]',
  backgroundColor: 'surfaceMuted',
});
