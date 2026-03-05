'use client';

import { css } from '@emotion/react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
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
        <div css={listStyle}>
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
                css={[optionStyle, isActive && optionActiveStyle]}
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

const listStyle = css`
  display: grid;
  gap: 0.2rem;
`;

const optionStyle = css`
  min-height: 2.8rem;
  width: 100%;
  padding: 0.7rem 0.8rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  font-size: 0.92rem;
  color: rgb(var(--color-text));
  background-color: transparent;
  transition:
    background-color 160ms ease,
    color 160ms ease;
`;

const optionActiveStyle = css`
  background-color: rgb(var(--color-primary));
  color: rgb(var(--color-primary-contrast));
`;
