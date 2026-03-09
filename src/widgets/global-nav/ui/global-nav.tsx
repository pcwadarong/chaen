'use client';

import { css } from '@emotion/react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { ArticleSearchForm } from '@/features/article-feed/ui/article-search-form';
import { Link, usePathname } from '@/i18n/navigation';
import { SearchIcon } from '@/shared/ui/icons/app-icons';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';
import type { GlobalNavItem } from '@/widgets/global-nav/model/navigation-item';
import { GlobalNavDesktopContent } from '@/widgets/global-nav/ui/global-nav-desktop-content';
import { GlobalNavMobileMenu } from '@/widgets/global-nav/ui/global-nav-mobile-menu';

const DESKTOP_FRAME_MEDIA_QUERY = '(min-width: 961px)';

/** 전역 네비게이션 위젯입니다. */
export const GlobalNav = () => {
  const t = useTranslations('Navigation');
  const articlesT = useTranslations('Articles');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isHidden, setIsHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const lastScrollYRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const isArticlesRoute = pathname === '/articles' || pathname.startsWith('/articles/');
  const currentSearchQuery = searchParams?.get('q')?.trim() ?? '';

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
    setIsMobileSearchOpen(false);
  }, [pathname, currentSearchQuery]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen && !isMobileSearchOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      if (isMobileSearchOpen) {
        setIsMobileSearchOpen(false);
        return;
      }

      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobileMenuOpen, isMobileSearchOpen]);

  return (
    <header css={[headerStyle, isHidden ? hiddenHeaderStyle : visibleHeaderStyle]}>
      {isArticlesRoute && isMobileSearchOpen ? (
        <div css={mobileSearchOverlayStyle}>
          <div css={mobileSearchOverlayInnerStyle}>
            <ArticleSearchForm
              autoFocus
              clearText={articlesT('searchClear')}
              fullWidth
              onSubmitComplete={() => setIsMobileSearchOpen(false)}
              pendingText={articlesT('loading')}
              placeholder={articlesT('searchPlaceholder')}
              searchMode="submit-only"
              searchQuery={currentSearchQuery}
              submitText={articlesT('searchSubmit')}
            />
            <button
              aria-label={articlesT('searchClose')}
              css={mobileSearchCloseStyle}
              onClick={() => setIsMobileSearchOpen(false)}
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
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
          leadingAction={
            isArticlesRoute ? (
              <button
                aria-expanded={isMobileSearchOpen}
                aria-label={articlesT('searchSubmit')}
                css={mobileSearchActionStyle}
                onClick={() => setIsMobileSearchOpen(true)}
                type="button"
              >
                <SearchIcon aria-hidden color="text" size="md" />
                <span className={srOnlyClass}>{articlesT('searchSubmit')}</span>
              </button>
            ) : null
          }
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
  position: relative;
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

const mobileSearchOverlayStyle = css`
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  background-color: rgb(var(--color-surface) / 0.94);
  backdrop-filter: blur(18px) saturate(135%);
  -webkit-backdrop-filter: blur(18px) saturate(135%);

  @media (min-width: 961px) {
    display: none;
  }
`;

const mobileSearchOverlayInnerStyle = css`
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-2);
`;

const mobileSearchActionStyle = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: rgb(var(--color-text));
  cursor: pointer;
  transition:
    background-color 160ms ease,
    box-shadow 160ms ease;

  &:hover {
    background: rgb(var(--color-text) / 0.06);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgb(var(--color-primary) / 0.18);
  }
`;

const mobileSearchCloseStyle = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: rgb(var(--color-text));
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  transition:
    background-color 160ms ease,
    box-shadow 160ms ease;

  &:hover {
    background: rgb(var(--color-text) / 0.06);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgb(var(--color-primary) / 0.18);
  }
`;
