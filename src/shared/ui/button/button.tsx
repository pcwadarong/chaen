import React from 'react';
import { cx, sva } from 'styled-system/css';
import type { RecipeVariantProps } from 'styled-system/types/recipe';

export type ButtonTone = 'white' | 'primary' | 'black';
export type ButtonVariant = 'solid' | 'ghost' | 'underline';
export type ButtonSize = 'xs' | 'sm' | 'md';

type ButtonRecipeProps = RecipeVariantProps<typeof buttonRecipe>;

type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> &
  ButtonRecipeProps & {
    asChild?: boolean;
    leadingVisual?: React.ReactNode;
    trailingVisual?: React.ReactNode;
  };

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
  const buttonClasses = buttonRecipe({ fullWidth, size, tone, variant });
  const buttonClassName = cx(buttonClasses.root, className);
  const renderContent = (labelContent: React.ReactNode) => (
    <>
      {leadingVisual ? (
        <span aria-hidden className={buttonClasses.visual}>
          {leadingVisual}
        </span>
      ) : null}
      <span className={buttonClasses.label}>{labelContent}</span>
      {trailingVisual ? (
        <span aria-hidden className={buttonClasses.visual}>
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
      type?: string;
    }>;

    const nextProps: {
      children: React.ReactNode;
      className: string;
      type?: string;
    } & typeof props = {
      ...props,
      className: cx(buttonClassName, child.props.className),
      children: renderContent(child.props.children),
    };

    if (typeof child.type === 'string' && child.type === 'button') {
      nextProps.type = type;
    }

    return React.cloneElement(child, nextProps);
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
export const buttonRecipe = sva({
  slots: ['root', 'label', 'visual'],
  base: {
    root: {
      appearance: 'none',
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
        outline: '[2px solid var(--colors-focus-ring)]',
        outlineOffset: '[2px]',
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
    label: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '0',
    },
    visual: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none',
      lineHeight: 'none',
    },
  },
  variants: {
    fullWidth: {
      true: { root: { width: 'full' } },
      false: {},
    },
    size: {
      xs: {
        root: { fontSize: 'xs' },
      },
      sm: {
        root: { fontSize: 'sm' },
      },
      md: {
        root: { fontSize: 'sm' },
      },
    },
    variant: {
      solid: {
        root: {
          borderStyle: 'solid',
          borderWidth: '1px',
          borderRadius: 'full',
        },
      },
      ghost: {
        root: {
          borderStyle: 'solid',
          borderWidth: '1px',
          borderRadius: 'full',
          background: 'transparent',
        },
      },
      underline: {
        root: {
          minHeight: 'auto',
          p: '0',
          justifyContent: 'flex-start',
          textDecoration: 'underline',
          textUnderlineOffset: '[0.18em]',
        },
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
      variant: ['solid', 'ghost'],
      size: 'xs',
      css: {
        root: {
          minHeight: '8',
          px: '2',
          py: '[0.375rem]',
        },
      },
    },
    {
      variant: ['solid', 'ghost'],
      size: 'sm',
      css: {
        root: {
          minHeight: '[2.375rem]',
          px: '3',
          py: '1',
        },
      },
    },
    {
      variant: ['solid', 'ghost'],
      size: 'md',
      css: {
        root: {
          minHeight: '[2.75rem]',
          px: '4',
          py: '2',
        },
      },
    },
    {
      tone: 'white',
      variant: 'solid',
      css: {
        root: {
          background: 'surface',
          borderColor: 'border',
          color: 'text',
          _hover: {
            background: 'surface',
            borderColor: 'borderStrong',
          },
        },
      },
    },
    {
      tone: 'primary',
      variant: 'solid',
      css: {
        root: {
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
    },
    {
      tone: 'black',
      variant: 'solid',
      css: {
        root: {
          background: 'text',
          color: 'surface',
          _hover: {
            background: 'gray.800',
            _dark: {
              background: 'gray.100',
            },
          },
        },
      },
    },
    {
      tone: 'white',
      variant: 'ghost',
      css: {
        root: {
          color: 'text',
          borderColor: 'transparent',
          _hover: {
            background: 'transparent',
            borderColor: 'transparent',
          },
        },
      },
    },
    {
      tone: 'primary',
      variant: 'ghost',
      css: {
        root: {
          color: 'primary',
          borderColor: 'transparent',
          _hover: {
            background: 'transparent',
            borderColor: 'transparent',
          },
        },
      },
    },
    {
      tone: 'black',
      variant: 'ghost',
      css: {
        root: {
          color: 'text',
          borderColor: 'transparent',
          _hover: {
            background: 'transparent',
            borderColor: 'transparent',
          },
        },
      },
    },
    {
      tone: 'white',
      variant: 'underline',
      css: { root: { color: 'text' } },
    },
    {
      tone: 'primary',
      variant: 'underline',
      css: { root: { color: 'primary' } },
    },
    {
      tone: 'black',
      variant: 'underline',
      css: { root: { color: 'text' } },
    },
  ],
  defaultVariants: {
    fullWidth: false,
    size: 'md',
    tone: 'white',
    variant: 'solid',
  },
});
