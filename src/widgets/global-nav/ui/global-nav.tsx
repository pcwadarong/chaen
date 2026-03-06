'use client';

import { css } from '@emotion/react';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useRef, useState } from 'react';

import { Link } from '@/i18n/navigation';
import { getButtonStyle } from '@/shared/ui/button/button';
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
    { href: '/project', label: t('project') },
    { href: '/articles', label: t('articles') },
    { href: '/guest', label: t('guest') },
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
                  <Link href={item.href} css={navLinkStyle}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
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
  box-shadow: 0 4px 12px rgb(var(--color-border) / 0.15);
  will-change: transform, opacity;
  transition:
    transform 240ms ease,
    opacity 240ms ease;
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
  align-items: flex-start;
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
  gap: var(--space-2);
  flex-wrap: wrap;
`;

const navLinkStyle = css`
  ${getButtonStyle({
    size: 'sm',
    tone: 'white',
    variant: 'ghost',
  })};
  font-size: var(--font-size-16);
  letter-spacing: 0.04em;
`;

const controlsStyle = css`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  flex-wrap: wrap;
`;

const switcherFallbackStyle = css`
  display: inline-flex;
  width: 8.5rem;
  min-height: 2.5rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--color-border) / 0.18);
  background-color: rgb(var(--color-surface) / 0.5);
`;
