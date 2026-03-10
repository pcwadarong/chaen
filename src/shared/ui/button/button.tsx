import React, { forwardRef } from 'react';
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

type ButtonAsChildProps = {
  'aria-disabled'?: React.AriaAttributes['aria-disabled'];
  children?: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  tabIndex?: number;
  type?: string;
};

/**
 * SVA를 사용하여 root, label, visual의 스타일을 통합 관리합니다.
 */
export const buttonRecipe = sva({
  slots: ['root', 'label', 'visual'],
  base: {
    root: {
      appearance: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2',
      userSelect: 'none',
      cursor: 'pointer',
      transition: 'common',
      letterSpacing: '[-0.01em]',
      _focusVisible: {
        outline: '[2px solid var(--colors-focus-ring)]',
        outlineOffset: '[2px]',
      },
      _disabled: {
        cursor: 'not-allowed',
        opacity: 0.48,
        pointerEvents: 'none', // 클릭 이벤트 원천 차단
      },
      '&[aria-disabled="true"]': {
        cursor: 'not-allowed',
        opacity: 0.48,
        pointerEvents: 'none',
      },
    },
    label: {
      display: 'inline-flex',
      alignItems: 'center',
      minWidth: '0',
    },
    visual: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none',
    },
  },
  variants: {
    fullWidth: {
      true: { root: { width: 'full' } },
      false: { root: { width: 'auto' } },
    },
    size: {
      xs: { root: { fontSize: 'xs' } },
      sm: { root: { fontSize: 'sm' } },
      md: { root: { fontSize: 'sm' } },
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
    /* 레이아웃: Solid/Ghost 형태일 때만 패딩과 높이 적용 */
    {
      variant: ['solid', 'ghost'],
      size: 'xs',
      css: { root: { minHeight: '8', px: '2' } },
    },
    {
      variant: ['solid', 'ghost'],
      size: 'sm',
      css: { root: { minHeight: '[2.375rem]', px: '3' } },
    },
    {
      variant: ['solid', 'ghost'],
      size: 'md',
      css: { root: { minHeight: '[2.75rem]', px: '4' } },
    },
    /* 색상: Solid */
    {
      tone: 'white',
      variant: 'solid',
      css: {
        root: {
          background: 'surface',
          borderColor: 'border',
          color: 'text',
          _hover: { borderColor: 'borderStrong' },
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
          borderColor: 'transparent',
          _hover: { background: 'blue.600' },
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
          borderColor: 'transparent',
          _hover: { background: 'zinc.800' },
        },
      },
    },
    /* 색상: Ghost/Underline */
    {
      tone: 'white',
      variant: ['ghost', 'underline'],
      css: { root: { color: 'text', borderColor: 'transparent' } },
    },
    {
      tone: 'primary',
      variant: ['ghost', 'underline'],
      css: { root: { color: 'primary', borderColor: 'transparent' } },
    },
    {
      tone: 'black',
      variant: ['ghost', 'underline'],
      css: { root: { color: 'text', borderColor: 'transparent' } },
    },
  ],
  defaultVariants: {
    fullWidth: false,
    size: 'md',
    tone: 'white',
    variant: 'solid',
  },
});

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      children,
      className,
      fullWidth,
      leadingVisual,
      size,
      tone,
      trailingVisual,
      type = 'button',
      variant,
      ...props
    },
    ref,
  ) => {
    const styles = buttonRecipe({ fullWidth, size, tone, variant });
    const isDisabled = props.disabled || props['aria-disabled'] === 'true';

    const renderContent = (labelContent: React.ReactNode) => (
      <>
        {leadingVisual && (
          <span aria-hidden className={styles.visual}>
            {leadingVisual}
          </span>
        )}
        <span className={styles.label}>{labelContent}</span>
        {trailingVisual && (
          <span aria-hidden className={styles.visual}>
            {trailingVisual}
          </span>
        )}
      </>
    );

    if (asChild) {
      if (!React.isValidElement(children)) {
        throw new Error('Button with asChild requires a single React element child.');
      }

      const child = children as React.ReactElement<ButtonAsChildProps>;
      const isNativeButtonElement = typeof child.type === 'string' && child.type === 'button';
      const nextProps: React.HTMLAttributes<HTMLElement> &
        React.ButtonHTMLAttributes<HTMLButtonElement> & {
          children: React.ReactNode;
          className: string;
          type?: string;
        } = {
        ...props,
        className: cx(styles.root, className, child.props.className),
        children: renderContent(child.props.children),
      };

      if (isNativeButtonElement) {
        nextProps.type = type;
      }

      if (isDisabled && !isNativeButtonElement) {
        delete nextProps.disabled;
        nextProps['aria-disabled'] = 'true';
        nextProps.tabIndex = -1;
        nextProps.onClick = event => {
          event.preventDefault();
          event.stopPropagation();
        };
      }

      return React.cloneElement(child, nextProps);
    }

    return (
      <button
        {...props}
        ref={ref}
        className={cx(styles.root, className)}
        type={type}
        disabled={props.disabled}
      >
        {renderContent(children)}
      </button>
    );
  },
);

Button.displayName = 'Button';
