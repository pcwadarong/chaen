'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';
import { Suspense } from 'react';

import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from '@/shared/ui/locale-switcher/locale-switcher';
import { ThemeSwitcher } from '@/shared/ui/theme-switcher/theme-switcher';

/** 전역 네비게이션 위젯입니다. */
export const GlobalNav = () => {
  const t = useTranslations('Navigation');

  const navigationItems = [
    { href: '/', label: t('home') },
    { href: '/resume', label: t('resume') },
    { href: '/guest', label: t('guest') },
    { href: '/blog', label: t('blog') },
    { href: '/work', label: t('work') },
  ] as const;

  return (
    <header style={headerStyle}>
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
