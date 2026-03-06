'use client';

import { css } from '@emotion/react';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useRef, useState } from 'react';

import { Link, usePathname } from '@/i18n/navigation';
import { getButtonStyle } from '@/shared/ui/button/button';
import { LocaleSwitcher } from '@/shared/ui/locale-switcher/locale-switcher';
import { ThemeSwitcher } from '@/shared/ui/theme-switcher/theme-switcher';
import { isActiveNavigationItem } from '@/widgets/global-nav/model/is-active-navigation-item';

const DESKTOP_FRAME_MEDIA_QUERY = '(min-width: 961px)';

/** 전역 네비게이션 위젯입니다. */
export const GlobalNav = () => {
  const t = useTranslations('Navigation');
  const pathname = usePathname();
  const [isHidden, setIsHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const lastScrollYRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  const navigationItems = [
    { href: '/', label: t('home') },
    { href: '/resume', label: t('resume') },
    { href: '/project', label: t('project') },
    { href: '/articles', label: t('articles') },
    { href: '/guest', label: t('guest') },
  ] as const;

  useEffect(() => {
    const desktopMedia = window.matchMedia(DESKTOP_FRAME_MEDIA_QUERY);
    const viewportElement = document.querySelector<HTMLElement>(
      '[data-app-scroll-viewport="true"]',
    );

    const getScrollBinding = () =>
      desktopMedia.matches && viewportElement
        ? {
            readScrollTop: () => viewportElement.scrollTop,
            target: viewportElement,
          }
        : {
            readScrollTop: () => window.scrollY,
            target: window,
          };

    let activeBinding = getScrollBinding();
    lastScrollYRef.current = activeBinding.readScrollTop();

    const updateByDirection = () => {
      const currentScrollY = activeBinding.readScrollTop();
      const delta = currentScrollY - lastScrollYRef.current;
      const nearTop = currentScrollY <= 8;

      if (nearTop) {
        setIsHidden(false);
      } else if (delta >= 6) {
        setIsHidden(true);
      } else if (delta <= -6) {
        setIsHidden(false);
      }

      lastScrollYRef.current = currentScrollY;
      rafIdRef.current = null;
    };

    const onScroll = () => {
      if (rafIdRef.current !== null) {
        return;
      }

      rafIdRef.current = window.requestAnimationFrame(updateByDirection);
    };

    const bind = () => {
      activeBinding.target.addEventListener('scroll', onScroll, { passive: true });
    };

    const unbind = () => {
      activeBinding.target.removeEventListener('scroll', onScroll);
    };

    const handleViewportModeChange = () => {
      unbind();
      activeBinding = getScrollBinding();
      lastScrollYRef.current = activeBinding.readScrollTop();
      setIsHidden(false);
      bind();
    };

    bind();
    desktopMedia.addEventListener('change', handleViewportModeChange);

    return () => {
      unbind();
      desktopMedia.removeEventListener('change', handleViewportModeChange);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header css={[headerStyle, isHidden ? hiddenHeaderStyle : visibleHeaderStyle]}>
        <div css={innerStyle}>
          <Link href="/" css={brandLinkStyle}>
            {t('brand')}
          </Link>
          <div css={contentStyle}>
            <nav aria-label={t('ariaLabel')}>
              <ul css={listStyle}>
                {navigationItems.map(item => (
                  <li key={item.href}>
                    <Link
                      aria-current={
                        isActiveNavigationItem(pathname, item.href) ? 'page' : undefined
                      }
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
          <div css={mobileControlsStyle}>
            <Suspense fallback={<span css={switcherFallbackStyle} />}>
              <LocaleSwitcher />
            </Suspense>
            <ThemeSwitcher />
            <button
              aria-controls="mobile-nav-drawer"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? t('closeMenu') : t('openMenu')}
              onClick={() => setIsMobileMenuOpen(previous => !previous)}
              css={hamburgerButtonStyle}
              type="button"
            >
              <span css={hamburgerLineStyle} />
              <span css={hamburgerLineStyle} />
              <span css={hamburgerLineStyle} />
            </button>
          </div>
        </div>
      </header>
      {isMobileMenuOpen ? (
        <div css={mobileOverlayStyle} onClick={() => setIsMobileMenuOpen(false)}>
          <aside
            aria-label={t('ariaLabel')}
            aria-modal="true"
            css={mobileDrawerStyle}
            id="mobile-nav-drawer"
            onClick={event => event.stopPropagation()}
            role="dialog"
          >
            <button
              aria-label={t('closeMenu')}
              onClick={() => setIsMobileMenuOpen(false)}
              css={drawerCloseStyle}
              type="button"
            >
              ×
            </button>
            <nav aria-label={t('ariaLabel')}>
              <ul css={mobileListStyle}>
                {navigationItems.map(item => (
                  <li key={item.href}>
                    <Link
                      aria-current={
                        isActiveNavigationItem(pathname, item.href) ? 'page' : undefined
                      }
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      css={mobileNavLinkStyle}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
};

const headerStyle = css`
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(18px) saturate(135%);
  -webkit-backdrop-filter: blur(18px) saturate(135%);
  background-color: rgb(var(--color-surface) / 0.72);
  border-bottom: 1px solid rgb(var(--color-border) / 0.16);
  box-shadow: 0 4px 16px rgb(var(--color-black) / 0.14);
  will-change: transform, opacity;
  transition:
    transform 240ms ease,
    opacity 240ms ease;

  @media (min-width: 961px) {
    border-top-left-radius: calc(2rem - 1px);
    border-top-right-radius: calc(2rem - 1px);
  }
`;

const visibleHeaderStyle = css`
  transform: translateY(0);
  opacity: 1;
`;

const hiddenHeaderStyle = css`
  transform: translateY(calc(-100% - 0.5rem));
  opacity: 0;
`;

const innerStyle = css`
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  padding: var(--space-4) var(--space-0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
`;

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

const brandLinkStyle = css`
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-decoration: none;
  color: rgb(var(--color-text));
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

const mobileControlsStyle = css`
  display: none;

  @media (max-width: 960px) {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    margin-left: auto;
  }
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

  &:hover {
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
  z-index: 18;
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
