'use client';

import { css } from '@emotion/react';
import Image from 'next/image';
import React from 'react';

export const themeOptions = ['system', 'light', 'dark'] as const;

export type ThemeOption = (typeof themeOptions)[number];

const themeIconSourceMap: Record<ThemeOption, string> = {
  dark: '/moon.svg',
  light: '/sun.svg',
  system: '/system.svg',
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
  const alt = decorative ? '' : themeIconAltMap[theme];

  return (
    <span aria-hidden={decorative} className={className} css={iconFrameStyle}>
      <Image alt={alt} height={20} src={themeIconSourceMap[theme]} width={20} />
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

  & > img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;
