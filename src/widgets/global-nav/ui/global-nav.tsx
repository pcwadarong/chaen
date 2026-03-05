'use client';

import { useTranslations } from 'next-intl';
import { type CSSProperties, Suspense, useEffect, useRef, useState } from 'react';

import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from '@/shared/ui/locale-switcher/locale-switcher';
import { ThemeSwitcher } from '@/shared/ui/theme-switcher/theme-switcher';

/** 전역 네비게이션 위젯입니다. */
export const GlobalNav = () => {
  const t = useTranslations('Navigation');
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  const navigationItems = [
    { href: '/', label: t('home') },
    { href: '/resume', label: t('resume') },
    { href: '/guest', label: t('guest') },
    { href: '/articles', label: t('articles') },
    { href: '/work', label: t('work') },
  ] as const;

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const updateByDirection = () => {
      const currentScrollY = window.scrollY;
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

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <header style={{ ...headerStyle, ...(isHidden ? hiddenHeaderStyle : visibleHeaderStyle) }}>
      <div style={innerStyle}>
        <Link href="/" style={brandLinkStyle}>
          {t('brand')}
        </Link>
        <div style={contentStyle}>
          <nav aria-label={t('ariaLabel')}>
            <ul style={listStyle}>
              {navigationItems.map(item => (
                <li key={item.href}>
                  <Link href={item.href} style={navLinkStyle}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div style={controlsStyle}>
            <Suspense fallback={<span style={switcherFallbackStyle} />}>
              <LocaleSwitcher />
            </Suspense>
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};

const headerStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  backdropFilter: 'blur(14px)',
  backgroundColor: 'rgb(var(--color-bg) / 0.78)',
  borderBottom: '1px solid rgb(var(--color-border) / 0.2)',
  willChange: 'transform, opacity',
  transition: 'transform 240ms ease, opacity 240ms ease',
};

const visibleHeaderStyle: CSSProperties = {
  transform: 'translateY(0)',
  opacity: 1,
};

const hiddenHeaderStyle: CSSProperties = {
  transform: 'translateY(calc(-100% - 0.5rem))',
  opacity: 0,
};

const innerStyle: CSSProperties = {
  width: 'min(1120px, calc(100% - 2rem))',
  margin: '0 auto',
  padding: '0.95rem 0',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem',
  flexWrap: 'wrap',
};

const contentStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '0.9rem',
  flexWrap: 'wrap',
  flex: '1 1 40rem',
};

const brandLinkStyle: CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  color: 'rgb(var(--color-text))',
};

const listStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const navLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '2.25rem',
  padding: '0 0.85rem',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid rgb(var(--color-border) / 0.24)',
  fontSize: '0.95rem',
  letterSpacing: '0.04em',
  textDecoration: 'none',
  backgroundColor: 'rgb(var(--color-surface) / 0.8)',
  color: 'rgb(var(--color-text))',
};

const controlsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '0.65rem',
  flexWrap: 'wrap',
};

const switcherFallbackStyle: CSSProperties = {
  display: 'inline-flex',
  width: '8.5rem',
  minHeight: '2.5rem',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid rgb(var(--color-border) / 0.18)',
  backgroundColor: 'rgb(var(--color-surface) / 0.5)',
};
