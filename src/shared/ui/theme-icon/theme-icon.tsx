'use client';

import { css } from '@emotion/react';
import React from 'react';

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
    <span aria-hidden={decorative} className={className} css={iconFrameStyle}>
      <Icon aria-hidden={decorative} aria-label={ariaLabel} role={decorative ? undefined : 'img'} />
    </span>
  );
};

const iconFrameStyle = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  flex: 0 0 auto;

  & > svg {
    width: 100%;
    height: 100%;
  }
`;
