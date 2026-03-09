'use client';

import { type ReactNode, Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { css } from 'styled-system/css';

import { Link } from '@/i18n/navigation';
import { useDialogFocusManagement } from '@/shared/lib/react/use-dialog-focus-management';
import { isActiveNavigationItem } from '@/widgets/global-nav/model/is-active-navigation-item';
import type { GlobalNavItem } from '@/widgets/global-nav/model/navigation-item';
import { LocaleSwitcher } from '@/widgets/global-nav/ui/locale-switcher';
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
export const GlobalNavMobileMenu = ({
  ariaLabel,
  closeMenuLabel,
  isOpen,
  leadingAction,
  navigationItems,
  onClose,
  onToggle,
  openMenuLabel,
  pathname,
}: GlobalNavMobileMenuProps) => {
  const drawerRef = useRef<HTMLElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useDialogFocusManagement({
    containerRef: drawerRef,
    isEnabled: isOpen,
    onEscape: onClose,
  });

  return (
    <>
      <div className={mobileControlsClass}>
        {leadingAction}
        <Suspense fallback={<span className={switcherFallbackClass} />}>
          <LocaleSwitcher />
        </Suspense>
        <ThemeSwitcher />
        <button
          aria-controls={MOBILE_NAV_DRAWER_ID}
          aria-expanded={isOpen}
          aria-label={isOpen ? closeMenuLabel : openMenuLabel}
          className={hamburgerButtonClass}
          onClick={onToggle}
          type="button"
        >
          <span className={hamburgerLineClass} />
          <span className={hamburgerLineClass} />
          <span className={hamburgerLineClass} />
        </button>
      </div>
      {isOpen && isMounted
        ? createPortal(
            <div className={mobileOverlayClass} onClick={onClose}>
              <aside
                aria-label={ariaLabel}
                aria-modal="true"
                className={mobileDrawerClass}
                id={MOBILE_NAV_DRAWER_ID}
                onClick={event => event.stopPropagation()}
                ref={drawerRef}
                role="dialog"
                tabIndex={-1}
              >
                <button
                  aria-label={closeMenuLabel}
                  className={drawerCloseClass}
                  onClick={onClose}
                  type="button"
                >
                  ×
                </button>
                <nav aria-label={ariaLabel}>
                  <ul className={mobileListClass}>
                    {navigationItems.map(item => (
                      <li key={item.href}>
                        <Link
                          aria-current={
                            isActiveNavigationItem(pathname, item.href) ? 'page' : undefined
                          }
                          className={mobileNavLinkClass}
                          href={item.href}
                          onClick={onClose}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

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
  borderRadius: 'pill',
  border: '[1px solid rgb(var(--color-border) / 0.18)]',
  backgroundColor: '[rgb(var(--color-surface) / 0.5)]',
});

const hamburgerButtonClass = css({
  width: '[2.5rem]',
  height: '[2.5rem]',
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '[0.22rem]',
  cursor: 'pointer',
  _hover: {
    borderColor: '[rgb(var(--color-border) / 0.4)]',
  },
  _focusVisible: {
    borderColor: '[rgb(var(--color-border) / 0.4)]',
  },
});

const hamburgerLineClass = css({
  width: '[0.95rem]',
  height: '[1.5px]',
  borderRadius: 'pill',
  backgroundColor: 'text',
});

const mobileOverlayClass = css({
  position: 'fixed',
  inset: '0',
  zIndex: '40',
  display: 'flex',
  justifyContent: 'flex-end',
  backgroundColor: '[rgb(var(--color-bg) / 0.32)]',
  backdropFilter: '[blur(8px) saturate(120%)]',
});

const mobileDrawerClass = css({
  width: '[min(26rem, 82vw)]',
  height: 'full',
  display: 'grid',
  alignContent: 'start',
  gap: '6',
  px: '5',
  py: '6',
  borderLeft: '[1px solid rgb(var(--color-primary) / 0.48)]',
  backgroundColor: 'surface',
  boxShadow: '[-10px 0 28px rgb(var(--color-black) / 0.18)]',
});

const drawerCloseClass = css({
  justifySelf: 'end',
  width: '[2.25rem]',
  height: '[2.25rem]',
  border: 'none',
  borderRadius: 'pill',
  background: 'transparent',
  color: 'muted',
  fontSize: '[1.9rem]',
  lineHeight: '100',
  cursor: 'pointer',
});

const mobileListClass = css({
  display: 'grid',
  gap: '6',
});

const mobileNavLinkClass = css({
  textDecoration: 'none',
  color: 'text',
  fontSize: '36',
  lineHeight: '[1.05]',
  letterSpacing: '[-0.02em]',
  _hover: {
    color: 'primary',
  },
  '&[aria-current="page"]': {
    color: 'primary',
  },
});
