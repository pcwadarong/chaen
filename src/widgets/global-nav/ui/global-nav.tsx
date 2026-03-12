'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { css, cx } from 'styled-system/css';

import { ArticleSearchForm } from '@/features/article-feed/ui/article-search-form';
import { Link, usePathname } from '@/i18n/navigation';
import { useAuth } from '@/shared/providers';
import { Button } from '@/shared/ui/button/button';
import { SearchIcon } from '@/shared/ui/icons/app-icons';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';
import { XButton } from '@/shared/ui/x-button/x-button';
import { buildGlobalNavigationItems } from '@/widgets/global-nav/model/build-navigation-items';
import { GlobalNavDesktopContent } from '@/widgets/global-nav/ui/global-nav-desktop-content';
import { GlobalNavMobileMenu } from '@/widgets/global-nav/ui/global-nav-mobile-menu';

const DESKTOP_FRAME_MEDIA_QUERY = '(min-width: 961px)';

/** 전역 네비게이션 위젯입니다. */
export const GlobalNav = () => {
  const t = useTranslations('Navigation');
  const articlesT = useTranslations('Articles');
  const { isAdmin } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isHidden, setIsHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const lastScrollYRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const isArticlesRoute = pathname === '/articles' || pathname.startsWith('/articles/');
  const currentSearchQuery = searchParams?.get('q')?.trim() ?? '';

  const navigationItems = buildGlobalNavigationItems({
    isAdmin,
    labels: {
      admin: '관리자',
      articles: t('articles'),
      guest: t('guest'),
      home: t('home'),
      project: t('project'),
      resume: t('resume'),
    },
  });

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
    <header className={cx(headerClass, isHidden ? hiddenHeaderClass : visibleHeaderClass)}>
      {isArticlesRoute && isMobileSearchOpen ? (
        <div className={mobileSearchOverlayClass}>
          <div className={mobileSearchOverlayInnerClass}>
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
            <XButton
              ariaLabel={articlesT('searchClose')}
              className={mobileSearchCloseClass}
              onClick={() => setIsMobileSearchOpen(false)}
            />
          </div>
        </div>
      ) : null}
      <div className={innerClass}>
        <Link className={brandLinkClass} href="/" prefetch>
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
              <Button
                aria-expanded={isMobileSearchOpen}
                aria-label={articlesT('searchSubmit')}
                className={mobileSearchActionClass}
                onClick={() => setIsMobileSearchOpen(true)}
                size="sm"
                tone="white"
                type="button"
                variant="ghost"
              >
                <SearchIcon aria-hidden color="text" size="md" />
                <span className={srOnlyClass}>{articlesT('searchSubmit')}</span>
              </Button>
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

const headerClass = css({
  position: 'sticky',
  top: '0',
  zIndex: '10',
  backdropFilter: '[blur(18px) saturate(135%)]',
  backgroundColor: 'surfaceMuted',
  borderBottom: '[1px solid var(--colors-border)]',
  boxShadow: 'floating',
  willChange: 'transform, opacity',
  transition: '[transform 240ms ease, opacity 240ms ease]',
  '@media (min-width: 961px)': {
    borderTopLeftRadius: '[calc(2rem - 1px)]',
    borderTopRightRadius: '[calc(2rem - 1px)]',
  },
});

const visibleHeaderClass = css({
  transform: 'translateY(0)',
  opacity: '1',
});

const hiddenHeaderClass = css({
  transform: '[translateY(calc(-100% - 0.5rem))]',
  opacity: '0',
});

const innerClass = css({
  position: 'relative',
  width: '[min(1120px, calc(100% - 2rem))]',
  mx: 'auto',
  py: '4',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '4',
  flexWrap: 'wrap',
});

const brandLinkClass = css({
  fontSize: 'md',
  fontWeight: 'bold',
  letterSpacing: '[0.18em]',
  textTransform: 'uppercase',
  textDecoration: 'none',
  color: 'text',
});

const mobileSearchOverlayClass = css({
  position: 'absolute',
  inset: '0',
  zIndex: '2',
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'surface',
  backdropFilter: '[blur(18px) saturate(135%)]',
  '@media (min-width: 961px)': {
    display: 'none',
  },
});

const mobileSearchOverlayInnerClass = css({
  width: '[min(1120px, calc(100% - 2rem))]',
  mx: 'auto',
  display: 'grid',
  gridTemplateColumns: '[minmax(0, 1fr) auto]',
  alignItems: 'center',
  gap: '2',
});

const mobileSearchActionClass = css({
  width: '[2.5rem]',
  p: '0',
  color: 'text',
  transition: '[background-color 160ms ease, box-shadow 160ms ease]',
  _hover: {
    background: 'textSubtle',
  },
});

const mobileSearchCloseClass = css({
  width: '[2.5rem]',
  p: '0',
  color: 'text',
  fontSize: '[1.5rem]',
  lineHeight: 'none',
  transition: '[background-color 160ms ease, box-shadow 160ms ease]',
  _hover: {
    background: 'textSubtle',
  },
});
