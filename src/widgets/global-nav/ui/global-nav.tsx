'use client';

import { css } from '@emotion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { Link, usePathname } from '@/i18n/navigation';
import type { GlobalNavItem } from '@/widgets/global-nav/model/navigation-item';
import { GlobalNavDesktopContent } from '@/widgets/global-nav/ui/global-nav-desktop-content';
import { GlobalNavMobileMenu } from '@/widgets/global-nav/ui/global-nav-mobile-menu';

const DESKTOP_FRAME_MEDIA_QUERY = '(min-width: 961px)';

/** 전역 네비게이션 위젯입니다. */
export const GlobalNav = () => {
  const t = useTranslations('Navigation');
  const pathname = usePathname();
  const [isHidden, setIsHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const lastScrollYRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  const navigationItems: readonly GlobalNavItem[] = [
    { href: '/', label: t('home') },
    { href: '/resume', label: t('resume') },
    { href: '/project', label: t('project') },
    { href: '/articles', label: t('articles') },
    { href: '/guest', label: t('guest') },
  ];

  // 스크롤 방향과 위치에 따라 헤더의 가시성을 토글하는 효과
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
      if (rafIdRef.current !== null) return;
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
    <header css={[headerStyle, isHidden ? hiddenHeaderStyle : visibleHeaderStyle]}>
      <div css={innerStyle}>
        <Link href="/" css={brandLinkStyle}>
          {t('brand')}
        </Link>
        <GlobalNavDesktopContent
          ariaLabel={t('ariaLabel')}
          navigationItems={navigationItems}
          pathname={pathname}
        />
        <GlobalNavMobileMenu
          ariaLabel={t('ariaLabel')}
          closeMenuLabel={t('closeMenu')}
          isOpen={isMobileMenuOpen}
          navigationItems={navigationItems}
          onClose={() => setIsMobileMenuOpen(false)}
          onToggle={() => setIsMobileMenuOpen(previous => !previous)}
          openMenuLabel={t('openMenu')}
          pathname={pathname}
        />
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

const brandLinkStyle = css`
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-decoration: none;
  color: rgb(var(--color-text));
`;
