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

  return (
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
      </div>
    </header>
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
