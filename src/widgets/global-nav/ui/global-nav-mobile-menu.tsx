'use client';

import { css } from '@emotion/react';
import { type ReactNode, Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
      <div css={mobileControlsStyle}>
        {leadingAction}
        <Suspense fallback={<span css={switcherFallbackStyle} />}>
          <LocaleSwitcher />
        </Suspense>
        <ThemeSwitcher />
        <button
          aria-controls={MOBILE_NAV_DRAWER_ID}
          aria-expanded={isOpen}
          aria-label={isOpen ? closeMenuLabel : openMenuLabel}
          onClick={onToggle}
          css={hamburgerButtonStyle}
          type="button"
        >
          <span css={hamburgerLineStyle} />
          <span css={hamburgerLineStyle} />
          <span css={hamburgerLineStyle} />
        </button>
      </div>
      {isOpen && isMounted
        ? createPortal(
            <div css={mobileOverlayStyle} onClick={onClose}>
              <aside
                aria-label={ariaLabel}
                aria-modal="true"
                css={mobileDrawerStyle}
                id={MOBILE_NAV_DRAWER_ID}
                onClick={event => event.stopPropagation()}
                ref={drawerRef}
                role="dialog"
                tabIndex={-1}
              >
                <button
                  aria-label={closeMenuLabel}
                  onClick={onClose}
                  css={drawerCloseStyle}
                  type="button"
                >
                  ×
                </button>
                <nav aria-label={ariaLabel}>
                  <ul css={mobileListStyle}>
                    {navigationItems.map(item => (
                      <li key={item.href}>
                        <Link
                          aria-current={
                            isActiveNavigationItem(pathname, item.href) ? 'page' : undefined
                          }
                          href={item.href}
                          onClick={onClose}
                          css={mobileNavLinkStyle}
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

const mobileControlsStyle = css`
  display: none;

  @media (max-width: 960px) {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    margin-left: auto;
  }
`;

const switcherFallbackStyle = css`
  display: inline-flex;
  width: 8.5rem;
  min-height: 2.5rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--color-border) / 0.18);
  background-color: rgb(var(--color-surface) / 0.5);
`;

const hamburgerButtonStyle = css`
  width: 2.5rem;
  height: 2.5rem;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.22rem;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: rgb(var(--color-border) / 0.4);
  }
`;

const hamburgerLineStyle = css`
  width: 0.95rem;
  height: 1.5px;
  border-radius: 999px;
  background-color: rgb(var(--color-text));
`;

const mobileOverlayStyle = css`
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  justify-content: flex-end;
  background-color: rgb(var(--color-bg) / 0.32);
  backdrop-filter: blur(8px) saturate(120%);
  -webkit-backdrop-filter: blur(8px) saturate(120%);
`;

const mobileDrawerStyle = css`
  @keyframes slideInDrawer {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  width: min(26rem, 82vw);
  height: 100%;
  display: grid;
  align-content: start;
  gap: var(--space-6);
  padding: var(--space-6) var(--space-5);
  border-left: 1px solid rgb(var(--color-primary) / 0.48);
  background-color: rgb(var(--color-surface));
  box-shadow: -10px 0 28px rgb(var(--color-black) / 0.18);
  animation: slideInDrawer 220ms ease;
`;

const drawerCloseStyle = css`
  justify-self: end;
  width: 2.25rem;
  height: 2.25rem;
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: rgb(var(--color-muted));
  font-size: 1.9rem;
  line-height: 1;
  cursor: pointer;
`;

const mobileListStyle = css`
  display: grid;
  gap: var(--space-6);
`;

const mobileNavLinkStyle = css`
  text-decoration: none;
  color: rgb(var(--color-text));
  font-size: var(--font-size-36);
  line-height: 1.05;
  letter-spacing: -0.02em;

  &:hover,
  &[aria-current='page'] {
    color: rgb(var(--color-primary));
  }
`;
