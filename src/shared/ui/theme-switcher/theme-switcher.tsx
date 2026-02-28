'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';

const themeOptions = ['system', 'light', 'dark'] as const;

/**
 * 전역 테마를 전환하는 세그먼트형 스위처입니다.
 */
export const ThemeSwitcher = () => {
  const t = useTranslations('Switchers.theme');
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeTheme = isMounted ? (theme ?? resolvedTheme ?? 'system') : 'system';

  return (
    <div aria-label={t('ariaLabel')} role="group" style={switcherStyle}>
      <span style={labelStyle}>{t('label')}</span>
      <div style={optionGroupStyle}>
        {themeOptions.map(option => {
          const isActive = activeTheme === option;

          return (
            <button
              aria-pressed={isActive}
              key={option}
              onClick={() => setTheme(option)}
              style={{
                ...optionStyle,
                ...(isActive ? optionActiveStyle : null),
              }}
              type="button"
            >
              {t(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const switcherStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const labelStyle: CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgb(var(--color-muted))',
};

const optionGroupStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.25rem',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid rgb(var(--color-border) / 0.7)',
  backgroundColor: 'rgb(var(--color-surface) / 0.86)',
};

const optionStyle: CSSProperties = {
  minHeight: '2.2rem',
  padding: '0 0.8rem',
  borderRadius: 'var(--radius-pill)',
  fontSize: '0.9rem',
  color: 'rgb(var(--color-muted))',
  transition: 'background-color 160ms ease, color 160ms ease',
};

const optionActiveStyle: CSSProperties = {
  backgroundColor: 'rgb(var(--color-primary))',
  color: 'rgb(var(--color-primary-contrast))',
};
