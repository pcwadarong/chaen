import { css } from '@emotion/react';
import type { ComponentType, ReactElement, SVGProps } from 'react';
import React from 'react';

import ArrowCurveLeftRightSvg from '@/shared/assets/icons/arrow-curve-left-right.svg';
import EditSvg from '@/shared/assets/icons/edit.svg';
import LockSvg from '@/shared/assets/icons/lock.svg';
import LockOpenSvg from '@/shared/assets/icons/lock_open.svg';
import MoonSvg from '@/shared/assets/icons/moon.svg';
import SendSvg from '@/shared/assets/icons/send.svg';
import SunSvg from '@/shared/assets/icons/sun.svg';
import SystemSvg from '@/shared/assets/icons/system.svg';
import TrashSvg from '@/shared/assets/icons/trash.svg';

type AppIconColor =
  | 'black'
  | 'current'
  | 'danger'
  | 'muted'
  | 'primary'
  | 'surface'
  | 'text'
  | 'white';
type AppIconSize = 'lg' | 'md' | 'sm' | number;

const iconColorMap: Record<Exclude<AppIconColor, 'current'>, string> = {
  black: 'rgb(var(--color-black))',
  danger: 'rgb(var(--color-danger))',
  muted: 'rgb(var(--color-muted))',
  primary: 'rgb(var(--color-primary))',
  surface: 'rgb(var(--color-surface))',
  text: 'rgb(var(--color-text))',
  white: 'rgb(var(--color-white))',
};

const iconSizeMap: Record<Exclude<AppIconSize, number>, number> = {
  lg: 20,
  md: 16,
  sm: 14,
};

export type AppIconProps = Omit<SVGProps<SVGSVGElement>, 'color' | 'height' | 'width'> & {
  color?: AppIconColor;
  customColor?: string;
  size?: AppIconSize;
};
export type AppIconComponent = (props: AppIconProps) => ReactElement;

const baseIconStyle = css`
  display: block;
  flex: 0 0 auto;
  vertical-align: middle;
`;

const strokeColorStyle = css`
  & * {
    stroke: currentColor;
  }
`;

/**
 * 아이콘 사이즈 토큰(sm/md/lg) 또는 숫자 값을 실제 픽셀 크기로 변환합니다.
 */
const resolveIconSize = (size: AppIconSize): number =>
  typeof size === 'number' ? size : iconSizeMap[size];

/**
 * 아이콘 색상 토큰 또는 커스텀 색상 값을 CSS color 값으로 변환합니다.
 */
const resolveIconColor = ({
  color,
  customColor,
}: Pick<AppIconProps, 'color' | 'customColor'>): string => {
  if (customColor) return customColor;
  if (!color || color === 'current') return 'currentColor';

  return iconColorMap[color];
};

/**
 * SVGR 아이콘을 공통 props/스타일 규격으로 감싸서 앱 전역에서 재사용합니다.
 */
const createAppIcon = (
  Svg: ComponentType<SVGProps<SVGSVGElement>> | string,
  {
    defaultSize = 16,
    style,
  }: {
    defaultSize?: number;
    style?: ReturnType<typeof css>;
  } = {},
) => {
  /**
   * 앱 공통 SVG 아이콘 컴포넌트입니다.
   * `size`로 아이콘 크기를 통제하고 색상은 `currentColor`를 따릅니다.
   */
  const AppIcon: AppIconComponent = ({
    color = 'current',
    customColor,
    size = defaultSize,
    ...props
  }: AppIconProps) => {
    const resolvedSize = resolveIconSize(size);
    const resolvedColor = resolveIconColor({ color, customColor });

    if (typeof Svg === 'string') {
      return (
        <svg
          aria-hidden
          css={[
            baseIconStyle,
            css`
              color: ${resolvedColor};
              width: ${resolvedSize}px;
              height: ${resolvedSize}px;
            `,
            style,
          ]}
          focusable="false"
          height={resolvedSize}
          role="img"
          viewBox="0 0 24 24"
          width={resolvedSize}
          {...props}
        />
      );
    }

    return (
      <Svg
        css={[
          baseIconStyle,
          strokeColorStyle,
          css`
            color: ${resolvedColor};
            width: ${resolvedSize}px;
            height: ${resolvedSize}px;
          `,
          style,
        ]}
        focusable="false"
        height={resolvedSize}
        width={resolvedSize}
        {...props}
      />
    );
  };

  return AppIcon;
};

export const ArrowCurveLeftRightIcon = createAppIcon(ArrowCurveLeftRightSvg);
export const EditIcon = createAppIcon(EditSvg);
export const LockIcon = createAppIcon(LockSvg);
export const LockOpenIcon = createAppIcon(LockOpenSvg);
export const MoonIcon = createAppIcon(MoonSvg);
export const SendIcon = createAppIcon(SendSvg);
export const SunIcon = createAppIcon(SunSvg);
export const SystemIcon = createAppIcon(SystemSvg);
export const TrashIcon = createAppIcon(TrashSvg);
