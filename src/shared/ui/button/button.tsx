'use client';

import { css, type Interpolation, type SerializedStyles, type Theme } from '@emotion/react';
import React from 'react';

export type ButtonTone = 'white' | 'primary' | 'black';
export type ButtonVariant = 'solid' | 'ghost' | 'underline';
export type ButtonSize = 'sm' | 'md';

type ButtonStyleOptions = {
  fullWidth?: boolean;
  size?: ButtonSize;
  tone?: ButtonTone;
  variant?: ButtonVariant;
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  css?: Interpolation<Theme>;
  fullWidth?: boolean;
  leadingVisual?: React.ReactNode;
  size?: ButtonSize;
  tone?: ButtonTone;
  trailingVisual?: React.ReactNode;
  variant?: ButtonVariant;
};

/**
 * 버튼의 색상/상태/크기를 조합하는 공용 스타일입니다.
 */
export const getButtonStyle = ({
  fullWidth = false,
  size = 'md',
  tone = 'white',
  variant = 'solid',
}: ButtonStyleOptions = {}): SerializedStyles => {
  const toneStyle = toneStyleMap[variant][tone];

  return css`
    appearance: none;
    border: none;
    outline: none;
    text-decoration: none;
    user-select: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    width: ${fullWidth ? '100%' : 'auto'};
    letter-spacing: -0.01em;
    transition:
      background-color 160ms ease,
      border-color 160ms ease,
      color 160ms ease,
      box-shadow 160ms ease,
      transform 160ms ease,
      opacity 160ms ease;

    ${sizeStyleMap[size]};
    ${variantBaseStyleMap[variant]};
    ${toneStyle};

    &:focus-visible {
      box-shadow: 0 0 0 3px rgb(var(--color-primary) / 0.18);
    }

    &:disabled,
    &[aria-disabled='true'] {
      cursor: not-allowed;
      opacity: 0.48;
      box-shadow: none;
      transform: none;
    }
  `;
};

/**
 * 버튼 내부에서 아이콘과 라벨을 같은 리듬으로 정렬합니다.
 */
export const Button = ({
  asChild = false,
  children,
  className,
  css: cssProp,
  fullWidth = false,
  leadingVisual,
  size = 'md',
  tone = 'white',
  trailingVisual,
  type = 'button',
  variant = 'solid',
  ...props
}: ButtonProps) => {
  const buttonCss = [
    getButtonStyle({
      fullWidth,
      size,
      tone,
      variant,
    }),
    cssProp,
  ];
  const renderContent = (labelContent: React.ReactNode) => (
    <>
      {leadingVisual ? (
        <span aria-hidden css={buttonVisualStyle}>
          {leadingVisual}
        </span>
      ) : null}
      <span css={buttonLabelStyle}>{labelContent}</span>
      {trailingVisual ? (
        <span aria-hidden css={buttonVisualStyle}>
          {trailingVisual}
        </span>
      ) : null}
    </>
  );

  if (asChild) {
    if (!React.isValidElement(children)) {
      throw new Error('Button with asChild requires a single React element child.');
    }

    const child = children as React.ReactElement<{
      children?: React.ReactNode;
      className?: string;
      css?: Interpolation<Theme>;
    }>;
    const childContent = child.props.children;

    return React.cloneElement(child, {
      ...props,
      className,
      css: [buttonCss, child.props.css],
      children: renderContent(childContent),
    });
  }

  return (
    <button {...props} className={className} css={buttonCss} type={type}>
      {renderContent(children)}
    </button>
  );
};

const sizeStyleMap: Record<ButtonSize, SerializedStyles> = {
  sm: css`
    min-height: 2.375rem;
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-pill);
    font-size: var(--font-size-14);
  `,
  md: css`
    min-height: 2.75rem;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-pill);
    font-size: var(--font-size-14);
  `,
};

const variantBaseStyleMap: Record<ButtonVariant, SerializedStyles> = {
  solid: css`
    border: 1px solid transparent;
  `,
  ghost: css`
    border: 1px solid transparent;
    background: transparent;
  `,
  underline: css`
    min-height: auto;
    padding: 0;
    border-radius: 0;
    background: transparent;
    justify-content: flex-start;
    text-decoration: underline;
    text-underline-offset: 0.18em;
  `,
};

type InteractiveToneStyleConfig = {
  background?: string;
  borderColor?: string;
  color: string;
  hoverBackground?: string;
  hoverBorderColor?: string;
};

const createInteractiveToneStyle = ({
  background,
  borderColor,
  color,
  hoverBackground,
  hoverBorderColor,
}: InteractiveToneStyleConfig): SerializedStyles => css`
  ${borderColor ? `border-color: ${borderColor};` : ''}
  ${background ? `background: ${background};` : ''}
  color: ${color};

  &:hover:not(:disabled):not([aria-disabled='true']) {
    ${hoverBorderColor ? `border-color: ${hoverBorderColor};` : ''}
    ${hoverBackground ? `background: ${hoverBackground};` : ''}
  }
`;

const solidToneStyleMap: Record<ButtonTone, SerializedStyles> = {
  white: createInteractiveToneStyle({
    background:
      'linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted))), rgb(var(--color-surface))',
    borderColor: 'rgb(var(--color-border) / 0.28)',
    color: 'rgb(var(--color-text))',
    hoverBackground: 'rgb(var(--color-surface))',
    hoverBorderColor: 'rgb(var(--color-border) / 0.42)',
  }),
  primary: createInteractiveToneStyle({
    background: 'rgb(var(--color-primary))',
    color: 'rgb(var(--color-primary-contrast))',
    hoverBackground: 'rgb(var(--color-primary) / 0.88)',
  }),
  black: createInteractiveToneStyle({
    background: 'rgb(var(--color-text))',
    color: 'rgb(var(--color-bg))',
    hoverBackground: 'rgb(var(--color-text) / 0.86)',
  }),
};

const ghostToneStyleMap: Record<ButtonTone, SerializedStyles> = {
  white: createInteractiveToneStyle({
    background: 'rgb(var(--color-surface) / 0.8)',
    borderColor: 'rgb(var(--color-border) / 0.24)',
    color: 'rgb(var(--color-text))',
    hoverBackground: 'rgb(var(--color-surface))',
    hoverBorderColor: 'rgb(var(--color-border) / 0.4)',
  }),
  primary: createInteractiveToneStyle({
    background: 'rgb(var(--color-primary) / 0.08)',
    borderColor: 'rgb(var(--color-primary) / 0.2)',
    color: 'rgb(var(--color-primary))',
    hoverBackground: 'rgb(var(--color-primary) / 0.12)',
    hoverBorderColor: 'rgb(var(--color-primary) / 0.34)',
  }),
  black: createInteractiveToneStyle({
    background: 'rgb(var(--color-text) / 0.06)',
    borderColor: 'rgb(var(--color-text) / 0.16)',
    color: 'rgb(var(--color-text))',
    hoverBackground: 'rgb(var(--color-text) / 0.1)',
    hoverBorderColor: 'rgb(var(--color-text) / 0.32)',
  }),
};

const underlineToneStyleMap: Record<ButtonTone, SerializedStyles> = {
  white: css`
    color: rgb(var(--color-text));
  `,
  primary: css`
    color: rgb(var(--color-primary));
  `,
  black: css`
    color: rgb(var(--color-text));
  `,
};

const toneStyleMap: Record<ButtonVariant, Record<ButtonTone, SerializedStyles>> = {
  solid: solidToneStyleMap,
  ghost: ghostToneStyleMap,
  underline: underlineToneStyleMap,
};

const buttonLabelStyle = css`
  display: inline-flex;
  align-items: center;
`;

const buttonVisualStyle = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
`;
