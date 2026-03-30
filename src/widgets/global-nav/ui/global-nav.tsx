'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { css, cx } from 'styled-system/css';

import { ArticleSearchForm } from '@/features/article-search/ui/article-search-form';
import { Link, usePathname } from '@/i18n/navigation';
import { viewportMediaQuery } from '@/shared/config/responsive';
import {
  HOME_HERO_NAV_LOCK_EVENT,
  type HomeHeroNavLockDetail,
} from '@/shared/lib/dom/home-hero-nav-lock';
import { useAuth } from '@/shared/providers';
import { Button } from '@/shared/ui/button/button';
import { SearchIcon } from '@/shared/ui/icons/app-icons';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';
import { XButton } from '@/shared/ui/x-button/x-button';
import { useGlobalNavHeightVar } from '@/widgets/global-nav/model/use-global-nav-height-var';
import { buildGlobalNavigationItems } from '@/widgets/global-nav/ui/build-navigation-items';
import { GlobalNavDesktopContent } from '@/widgets/global-nav/ui/global-nav-desktop-content';
import { GlobalNavMobileMenu } from '@/widgets/global-nav/ui/global-nav-mobile-menu';
import { resolveGlobalNavHidden } from '@/widgets/global-nav/ui/resolve-global-nav-hidden';

const DESKTOP_FRAME_MEDIA_QUERY = viewportMediaQuery.desktopUp;

type GlobalNavMobileSearchOverlayProps = {
  clearText: string;
  closeLabel: string;
  onClose: () => void;
  onSubmitComplete: () => void;
  pendingText: string;
  placeholder: string;
  searchQuery: string;
  submitText: string;
};

/**
 * 모바일 아티클 검색 overlay와 닫기 액션을 함께 렌더링합니다.
 */
const GlobalNavMobileSearchOverlayBase = ({
  clearText,
  closeLabel,
  onClose,
  onSubmitComplete,
  pendingText,
  placeholder,
  searchQuery,
  submitText,
}: GlobalNavMobileSearchOverlayProps) => (
  <div className={mobileSearchOverlayClass}>
    <div className={mobileSearchOverlayInnerClass}>
      <ArticleSearchForm
        autoFocus
        clearText={clearText}
        fullWidth
        onSubmitComplete={onSubmitComplete}
        pendingText={pendingText}
        placeholder={placeholder}
        searchMode="submit-only"
        searchQuery={searchQuery}
        submitText={submitText}
      />
      <XButton ariaLabel={closeLabel} className={mobileSearchCloseClass} onClick={onClose} />
    </div>
  </div>
);

GlobalNavMobileSearchOverlayBase.displayName = 'GlobalNavMobileSearchOverlay';

const GlobalNavMobileSearchOverlay = React.memo(GlobalNavMobileSearchOverlayBase);

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
  const headerRef = useRef<HTMLElement>(null);
  const isHomeHeroNavLockedRef = useRef(false);
  const lastScrollYRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const isArticlesRoute = pathname === '/articles' || pathname.startsWith('/articles/');
  const currentSearchQuery = searchParams?.get('q')?.trim() ?? '';
  const homeLabel = t('home');
  const resumeLabel = t('resume');
  const projectLabel = t('project');
  const articlesLabel = t('articles');
  const guestLabel = t('guest');
  const ariaLabel = t('ariaLabel');
  const openMenuLabel = t('openMenu');
  const closeMenuLabel = t('closeMenu');
  const brandLabel = t('brand');
  const searchSubmitLabel = articlesT('searchSubmit');
  const searchClearLabel = articlesT('searchClear');
  const searchPlaceholderLabel = articlesT('searchPlaceholder');
  const searchLoadingLabel = articlesT('loading');
  const searchCloseLabel = articlesT('searchClose');

  const navigationItems = useMemo(
    () =>
      buildGlobalNavigationItems({
        isAdmin,
        labels: {
          articles: articlesLabel,
          guest: guestLabel,
          home: homeLabel,
          project: projectLabel,
          resume: resumeLabel,
        },
      }),
    [articlesLabel, guestLabel, homeLabel, isAdmin, projectLabel, resumeLabel],
  );

  /**
   * 모바일 메뉴를 닫습니다.
   */
  const handleMobileMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  /**
   * 모바일 검색 overlay를 닫습니다.
   */
  const handleMobileSearchClose = useCallback(() => {
    setIsMobileSearchOpen(false);
  }, []);

  /**
   * 모바일 검색 overlay를 엽니다.
   */
  const handleMobileSearchOpen = useCallback(() => {
    setIsMobileSearchOpen(true);
  }, []);

  /**
   * 모바일 메뉴 열림 상태를 토글합니다.
   */
  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen(previous => !previous);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHomeHeroNavLockChange = (event: Event) => {
      const customEvent = event as CustomEvent<HomeHeroNavLockDetail>;
      const locked = customEvent.detail?.locked ?? false;

      isHomeHeroNavLockedRef.current = locked;

      if (locked) {
        setIsHidden(false);
      }
    };

    window.addEventListener(HOME_HERO_NAV_LOCK_EVENT, handleHomeHeroNavLockChange);

    return () => {
      window.removeEventListener(HOME_HERO_NAV_LOCK_EVENT, handleHomeHeroNavLockChange);
    };
  }, []);

  /**
   * 현재 스크롤 컨테이너(window 또는 app-frame viewport)에 이벤트를 연결하고
   * 스크롤 위치 변화를 기준으로 네비게이션 숨김 상태를 동기화합니다.
   *
   * 데스크톱 프레임 모드에서는 내부 viewport를, 그 외에는 window를 구독해야 하므로
   * 바인딩 대상 자체를 effect 안에서 관리합니다.
   */
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

    /**
     * 현재 스크롤 위치와 헤더 높이를 읽어 숨김 여부를 계산합니다.
     * 실제 규칙은 순수 함수로 분리해 DOM 이벤트 처리와 비즈니스 판단을 분리합니다.
     */
    const updateByDirection = () => {
      const currentScrollY = activeBinding.readScrollTop();
      const headerHeight = headerRef.current?.offsetHeight ?? 0;

      if (isHomeHeroNavLockedRef.current) {
        setIsHidden(false);
        lastScrollYRef.current = currentScrollY;
        rafIdRef.current = null;

        return;
      }

      setIsHidden(previousHidden =>
        resolveGlobalNavHidden({
          currentScrollY,
          headerHeight,
          lastScrollY: lastScrollYRef.current,
          previousHidden,
        }),
      );

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
    handleMobileMenuClose();
  }, [handleMobileMenuClose, pathname]);

  useEffect(() => {
    handleMobileSearchClose();
  }, [currentSearchQuery, handleMobileSearchClose, pathname]);

  useEffect(() => {
    if (!isMobileSearchOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      handleMobileSearchClose();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleMobileSearchClose, isMobileSearchOpen]);

  useGlobalNavHeightVar(headerRef);

  const mobileSearchLeadingAction = useMemo(() => {
    if (!isArticlesRoute) {
      return null;
    }

    return (
      <Button
        aria-expanded={isMobileSearchOpen}
        aria-label={searchSubmitLabel}
        className={mobileSearchActionClass}
        onClick={handleMobileSearchOpen}
        size="sm"
        tone="white"
        type="button"
        variant="ghost"
      >
        <SearchIcon aria-hidden color="text" size="md" />
        <span className={srOnlyClass}>{searchSubmitLabel}</span>
      </Button>
    );
  }, [handleMobileSearchOpen, isArticlesRoute, isMobileSearchOpen, searchSubmitLabel]);

  return (
    <header
      className={cx(headerClass, isHidden ? hiddenHeaderClass : visibleHeaderClass)}
      ref={headerRef}
    >
      {isArticlesRoute && isMobileSearchOpen ? (
        <GlobalNavMobileSearchOverlay
          clearText={searchClearLabel}
          closeLabel={searchCloseLabel}
          onClose={handleMobileSearchClose}
          onSubmitComplete={handleMobileSearchClose}
          pendingText={searchLoadingLabel}
          placeholder={searchPlaceholderLabel}
          searchQuery={currentSearchQuery}
          submitText={searchSubmitLabel}
        />
      ) : null}
      <div className={innerClass}>
        <Link className={brandLinkClass} href="/" prefetch>
          {brandLabel}
        </Link>
        <GlobalNavDesktopContent
          ariaLabel={ariaLabel}
          navigationItems={navigationItems}
          pathname={pathname}
        />
        <GlobalNavMobileMenu
          ariaLabel={ariaLabel}
          closeMenuLabel={closeMenuLabel}
          isOpen={isMobileMenuOpen}
          leadingAction={mobileSearchLeadingAction}
          navigationItems={navigationItems}
          onClose={handleMobileMenuClose}
          onToggle={handleMobileMenuToggle}
          openMenuLabel={openMenuLabel}
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
  _desktopUp: {
    borderTopLeftRadius: '[calc(2rem - 1px)]',
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
  width: 'full',
  maxWidth: 'contentWide',
  boxSizing: 'border-box',
  mx: 'auto',
  px: '4',
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
  _desktopUp: {
    display: 'none',
  },
});

const mobileSearchOverlayInnerClass = css({
  width: 'full',
  maxWidth: 'contentWide',
  boxSizing: 'border-box',
  mx: 'auto',
  px: '4',
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
