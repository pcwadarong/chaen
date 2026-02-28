'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';

import { SwitcherPopover } from '@/shared/ui/switcher-popover/switcher-popover';

const themeOptions = ['system', 'light', 'dark'] as const;

/**
 * 전역 테마를 전환하는 팝오버형 스위처입니다.
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
    <SwitcherPopover label={t('label')} panelLabel={t('ariaLabel')} value={t(activeTheme)}>
      {({ closePopover }) => (
        <div style={listStyle}>
          {themeOptions.map(option => {
            const isActive = activeTheme === option;

            return (
              <button
                aria-pressed={isActive}
                key={option}
                onClick={() => {
                  setTheme(option);
                  closePopover();
                }}
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
      )}
    </SwitcherPopover>
  );
};

const listStyle: CSSProperties = {
  display: 'grid',
  gap: '0.2rem',
};

const optionStyle: CSSProperties = {
  minHeight: '2.8rem',
  width: '100%',
  padding: '0.7rem 0.8rem',
  borderRadius: 'var(--radius-sm)',
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.92rem',
  color: 'rgb(var(--color-text))',
  backgroundColor: 'transparent',
  transition: 'background-color 160ms ease, color 160ms ease',
};

const optionActiveStyle: CSSProperties = {
  backgroundColor: 'rgb(var(--color-primary))',
  color: 'rgb(var(--color-primary-contrast))',
};
