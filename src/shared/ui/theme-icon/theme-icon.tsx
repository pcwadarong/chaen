import { css, cx } from 'styled-system/css';

import { type AppIconComponent, MoonIcon, SunIcon, SystemIcon } from '@/shared/ui/icons/app-icons';

export const themeOptions = ['system', 'light', 'dark'] as const;

export type ThemeOption = (typeof themeOptions)[number];

const themeIconComponentMap: Record<ThemeOption, AppIconComponent> = {
  dark: MoonIcon,
  light: SunIcon,
  system: SystemIcon,
};

const themeIconAltMap: Record<ThemeOption, string> = {
  dark: 'Dark theme icon',
  light: 'Light theme icon',
  system: 'System theme icon',
};

type ThemeIconProps = {
  className?: string;
  decorative?: boolean;
  theme: ThemeOption;
};

/**
 * 테마 옵션에 대응하는 공통 아이콘을 렌더링합니다.
 */
export const ThemeIcon = ({ className, decorative = true, theme }: ThemeIconProps) => {
  const Icon = themeIconComponentMap[theme];
  const ariaLabel = decorative ? undefined : themeIconAltMap[theme];

  return (
    <span aria-hidden={decorative} className={cx(themeIconFrameClass, className)}>
      <Icon aria-hidden={decorative} aria-label={ariaLabel} role={decorative ? undefined : 'img'} />
    </span>
  );
};

const themeIconFrameClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '5',
  height: '5',
  flex: 'none',
  '& > svg': {
    width: 'full',
    height: 'full',
  },
});
