'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { css } from 'styled-system/css';

import { Button } from '@/shared/ui/button/button';
import { SwitcherPopover } from '@/shared/ui/switcher-popover/switcher-popover';
import { ThemeIcon, type ThemeOption, themeOptions } from '@/shared/ui/theme-icon/theme-icon';

/**
 * 테마 문자열이 스위처에서 지원하는 옵션인지 확인합니다.
 */
const isThemeOption = (value: string | undefined): value is ThemeOption =>
  Boolean(value && themeOptions.includes(value as ThemeOption));

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

  const activeTheme: ThemeOption = (() => {
    if (!isMounted) return 'system';
    if (isThemeOption(theme)) return theme;
    if (isThemeOption(resolvedTheme)) return resolvedTheme;

    return 'system';
  })();

  return (
    <SwitcherPopover
      label={t('label')}
      panelLabel={t('ariaLabel')}
      triggerContent={<ThemeIcon theme={activeTheme} />}
    >
      {({ closePopover }) => (
        <div className={listClass}>
          {themeOptions.map(option => {
            const isActive = activeTheme === option;

            return (
              <Button
                aria-pressed={isActive}
                className={optionClass}
                key={option}
                onClick={() => {
                  setTheme(option);
                  closePopover();
                }}
                tone={isActive ? 'black' : 'white'}
                type="button"
                variant={isActive ? 'solid' : 'ghost'}
                leadingVisual={<ThemeIcon theme={option} />}
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

const listClass = css({
  display: 'grid',
  gap: '1',
});

const optionClass = css({
  width: 'full',
  justifyContent: 'flex-start',
});
