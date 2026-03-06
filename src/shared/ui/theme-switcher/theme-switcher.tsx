'use client';

import { css } from '@emotion/react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '@/shared/ui/button/button';
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
              <Button
                aria-pressed={isActive}
                key={option}
                onClick={() => {
                  setTheme(option);
                  closePopover();
                }}
                css={optionStyle}
                tone={isActive ? 'black' : 'white'}
                type="button"
                variant={isActive ? 'solid' : 'ghost'}
              >
                {t(option)}
              </Button>
            );
          })}
        </div>
      )}
    </SwitcherPopover>
  );
};

const listStyle = css`
  display: grid;
  gap: var(--space-1);
`;

const optionStyle = css`
  width: 100%;
  justify-content: flex-start;
`;
