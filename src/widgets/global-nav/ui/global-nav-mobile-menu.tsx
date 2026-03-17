'use client';

import React, { type ReactNode, Suspense } from 'react';
import { css } from 'styled-system/css';

import { Link } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button/button';
import { HamburgerIcon } from '@/shared/ui/icons/app-icons';
import { SlideOver } from '@/shared/ui/slide-over/slide-over';
import { XButton } from '@/shared/ui/x-button/x-button';
import { isActiveNavigationItem } from '@/widgets/global-nav/ui/is-active-navigation-item';
import { LocaleSwitcher } from '@/widgets/global-nav/ui/locale-switcher';
import type { GlobalNavItem } from '@/widgets/global-nav/ui/navigation-item';
import { ThemeSwitcher } from '@/widgets/global-nav/ui/theme-switcher';

type GlobalNavMobileMenuProps = {
  ariaLabel: string;
  closeMenuLabel: string;
  isOpen: boolean;
  leadingAction?: ReactNode;
  navigationItems: readonly GlobalNavItem[];
  onClose: () => void;
  onToggle: () => void;
  openMenuLabel: string;
  pathname: string;
};

const MOBILE_NAV_DRAWER_ID = 'mobile-nav-drawer';

/** 모바일 뷰에서 사용하는 햄버거 트리거와 슬라이드 드로어 메뉴입니다. */
const GlobalNavMobileMenuBase = ({
  ariaLabel,
  closeMenuLabel,
  isOpen,
  leadingAction,
  navigationItems,
  onClose,
  onToggle,
  openMenuLabel,
  pathname,
}: GlobalNavMobileMenuProps) => (
  <>
    <div className={mobileControlsClass}>
      {leadingAction}
      <Suspense fallback={<span className={switcherFallbackClass} />}>
        <LocaleSwitcher />
      </Suspense>
      <ThemeSwitcher />
      <Button
        aria-controls={MOBILE_NAV_DRAWER_ID}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={isOpen ? closeMenuLabel : openMenuLabel}
        className={hamburgerButtonClass}
        onClick={onToggle}
        size="sm"
        tone="white"
        type="button"
        variant="ghost"
      >
        <HamburgerIcon aria-hidden size={18} />
      </Button>
    </div>
    <SlideOver
      ariaLabel={ariaLabel}
      className={mobileDrawerClass}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className={mobileDrawerInnerClass} id={MOBILE_NAV_DRAWER_ID}>
        <XButton ariaLabel={closeMenuLabel} className={drawerCloseClass} onClick={onClose} />
        <nav aria-label={ariaLabel}>
          <ul className={mobileListClass}>
            {navigationItems.map(item => (
              <li key={item.href}>
                <Link
                  aria-current={isActiveNavigationItem(pathname, item.href) ? 'page' : undefined}
                  className={mobileNavLinkClass}
                  href={item.href}
                  onClick={onClose}
                  prefetch
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </SlideOver>
  </>
);

GlobalNavMobileMenuBase.displayName = 'GlobalNavMobileMenu';

export const GlobalNavMobileMenu = React.memo(GlobalNavMobileMenuBase);

const mobileControlsClass = css({
  display: 'none',
  '@media (max-width: 960px)': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2',
    marginLeft: 'auto',
  },
});

const switcherFallbackClass = css({
  display: 'inline-flex',
  width: '[8.5rem]',
  minHeight: '[2.5rem]',
  borderRadius: 'full',
  border: '[1px solid var(--colors-border)]',
  backgroundColor: 'surfaceMuted',
});

const hamburgerButtonClass = css({
  width: '[2.5rem]',
  minHeight: '[2.5rem]',
  _hover: {
    color: 'primary',
  },
  _focusVisible: {
    color: 'primary',
  },
});

const mobileDrawerClass = css({
  width: '[min(26rem, 82vw)]',
  height: 'full',
  px: '5',
  py: '6',
  borderLeft: '[1px solid var(--colors-primary)]',
  backgroundColor: '[rgb(255 255 255 / 0.88)]',
  boxShadow: 'floating',
  backdropFilter: '[blur(18px) saturate(135%)]',
  _dark: {
    backgroundColor: '[rgb(31 41 55 / 0.88)]',
  },
});

const mobileDrawerInnerClass = css({
  display: 'grid',
  alignContent: 'start',
  gap: '6',
});

const drawerCloseClass = css({
  justifySelf: 'end',
  color: 'muted',
  fontSize: '3xl',
  lineHeight: 'none',
  _hover: {
    color: 'primary',
  },
  _focusVisible: {
    color: 'primary',
  },
});

const mobileListClass = css({
  display: 'grid',
  gap: '6',
});

const mobileNavLinkClass = css({
  textDecoration: 'none',
  color: 'text',
  fontSize: 'xl',
  lineHeight: 'none',
  letterSpacing: '[-0.02em]',
  _hover: {
    color: 'primary',
  },
  _focusVisible: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
    color: 'primary',
  },
  '&[aria-current="page"]': {
    color: 'primary',
  },
});
