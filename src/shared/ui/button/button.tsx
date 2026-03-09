import React from 'react';
import { css, cva, cx } from 'styled-system/css';
import type { RecipeVariantProps } from 'styled-system/types/recipe';

export type ButtonTone = 'white' | 'primary' | 'black';
export type ButtonVariant = 'solid' | 'ghost' | 'underline';
export type ButtonSize = 'sm' | 'md';

type ButtonRecipeProps = RecipeVariantProps<typeof buttonRecipe>;

type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> &
  ButtonRecipeProps & {
    asChild?: boolean;
    leadingVisual?: React.ReactNode;
    trailingVisual?: React.ReactNode;
  };

const buttonLabelClass = css({
  display: 'inline-flex',
  alignItems: 'center',
});

const buttonVisualClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 'none',
});

/**
 * 버튼 내부에서 아이콘과 라벨을 같은 리듬으로 정렬합니다.
 */
export const Button = ({
  asChild = false,
  children,
  className,
  fullWidth = false,
  leadingVisual,
  size = 'md',
  tone = 'white',
  trailingVisual,
  type = 'button',
  variant = 'solid',
  ...props
}: ButtonProps) => {
  const buttonClassName = cx(buttonRecipe({ fullWidth, size, tone, variant }), className);
  const renderContent = (labelContent: React.ReactNode) => (
    <>
      {leadingVisual ? (
        <span aria-hidden className={buttonVisualClass}>
          {leadingVisual}
        </span>
      ) : null}
      <span className={buttonLabelClass}>{labelContent}</span>
      {trailingVisual ? (
        <span aria-hidden className={buttonVisualClass}>
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
    }>;

    return React.cloneElement(child, {
      ...props,
      className: cx(buttonClassName, child.props.className),
      children: renderContent(child.props.children),
    });
  }

  return (
    <button {...props} className={buttonClassName} type={type}>
      {renderContent(children)}
    </button>
  );
};

/**
 * 버튼의 공통 스타일과 variant 조합을 정의합니다.
 */
export const buttonRecipe = cva({
  base: {
    appearance: 'none',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    outline: 'none',
    textDecoration: 'none',
    userSelect: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2',
    width: 'auto',
    letterSpacing: '[-0.01em]',
    transition: 'common',
    _focusVisible: {
      boxShadow: '[0 0 0 3px var(--colors-focus-ring)]',
    },
    _disabled: {
      cursor: 'not-allowed',
      opacity: 0.48,
    },
    '&[aria-disabled="true"]': {
      cursor: 'not-allowed',
      opacity: 0.48,
    },
  },
  variants: {
    fullWidth: {
      true: { width: 'full' },
      false: {},
    },
    size: {
      sm: {
        minHeight: '[2.375rem]',
        px: '3',
        py: '1',
        borderRadius: 'full',
        fontSize: 'sm',
      },
      md: {
        minHeight: '[2.75rem]',
        px: '4',
        py: '2',
        borderRadius: 'full',
        fontSize: 'sm',
      },
    },
    variant: {
      solid: {},
      ghost: {
        background: 'transparent',
      },
      underline: {
        minHeight: 'auto',
        p: '0',
        borderRadius: '[0]',
        background: 'transparent',
        justifyContent: 'flex-start',
        textDecoration: 'underline',
        textUnderlineOffset: '[0.18em]',
      },
    },
    tone: {
      white: {},
      primary: {},
      black: {},
    },
  },
  compoundVariants: [
    {
      tone: 'white',
      variant: 'solid',
      css: {
        background: 'surface',
        borderColor: 'border',
        color: 'text',
        _hover: {
          background: 'surface',
          borderColor: 'borderStrong',
        },
      },
    },
    {
      tone: 'primary',
      variant: 'solid',
      css: {
        background: 'primary',
        color: 'primaryContrast',
        _hover: {
          background: 'blue.600',
          _dark: {
            background: 'blue.200',
          },
        },
      },
    },
    {
      tone: 'black',
      variant: 'solid',
      css: {
        background: 'text',
        color: 'bg',
        _hover: {
          background: 'gray.800',
          _dark: {
            background: 'gray.100',
          },
        },
      },
    },
    {
      tone: 'white',
      variant: 'ghost',
      css: {
        background: 'surfaceMuted',
        borderColor: 'border',
        color: 'text',
        _hover: {
          background: 'surface',
          borderColor: 'borderStrong',
        },
      },
    },
    {
      tone: 'primary',
      variant: 'ghost',
      css: {
        background: 'primarySubtle',
        borderColor: 'primary',
        color: 'primary',
        _hover: {
          background: 'primaryMuted',
          borderColor: 'primary',
        },
      },
    },
    {
      tone: 'black',
      variant: 'ghost',
      css: {
        background: 'textSubtle',
        borderColor: 'border',
        color: 'text',
        _hover: {
          background: 'surfaceStrong',
          borderColor: 'borderStrong',
        },
      },
    },
    {
      tone: 'white',
      variant: 'underline',
      css: { color: 'text' },
    },
    {
      tone: 'primary',
      variant: 'underline',
      css: { color: 'primary' },
    },
    {
      tone: 'black',
      variant: 'underline',
      css: { color: 'text' },
    },
  ],
  defaultVariants: {
    fullWidth: false,
    size: 'md',
    tone: 'white',
    variant: 'solid',
  },
});
