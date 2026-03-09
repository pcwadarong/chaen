import { cva } from 'styled-system/css';

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
      boxShadow: '[0 0 0 3px rgb(var(--color-primary) / 0.18)]',
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
      true: {
        width: 'full',
      },
      false: {},
    },
    size: {
      sm: {
        minHeight: '[2.375rem]',
        px: '3',
        py: '1',
        borderRadius: 'pill',
        fontSize: '14',
      },
      md: {
        minHeight: '[2.75rem]',
        px: '4',
        py: '2',
        borderRadius: 'pill',
        fontSize: '14',
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
        borderColor: '[rgb(var(--color-border) / 0.28)]',
        color: 'text',
        _hover: {
          background: 'surface',
          borderColor: '[rgb(var(--color-border) / 0.42)]',
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
          background: '[rgb(var(--color-primary) / 0.88)]',
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
          background: '[rgb(var(--color-text) / 0.86)]',
        },
      },
    },
    {
      tone: 'white',
      variant: 'ghost',
      css: {
        background: '[rgb(var(--color-surface) / 0.8)]',
        borderColor: '[rgb(var(--color-border) / 0.24)]',
        color: 'text',
        _hover: {
          background: 'surface',
          borderColor: '[rgb(var(--color-border) / 0.4)]',
        },
      },
    },
    {
      tone: 'primary',
      variant: 'ghost',
      css: {
        background: '[rgb(var(--color-primary) / 0.08)]',
        borderColor: '[rgb(var(--color-primary) / 0.2)]',
        color: 'primary',
        _hover: {
          background: '[rgb(var(--color-primary) / 0.12)]',
          borderColor: '[rgb(var(--color-primary) / 0.34)]',
        },
      },
    },
    {
      tone: 'black',
      variant: 'ghost',
      css: {
        background: '[rgb(var(--color-text) / 0.06)]',
        borderColor: '[rgb(var(--color-text) / 0.16)]',
        color: 'text',
        _hover: {
          background: '[rgb(var(--color-text) / 0.1)]',
          borderColor: '[rgb(var(--color-text) / 0.32)]',
        },
      },
    },
    {
      tone: 'white',
      variant: 'underline',
      css: {
        color: 'text',
      },
    },
    {
      tone: 'primary',
      variant: 'underline',
      css: {
        color: 'primary',
      },
    },
    {
      tone: 'black',
      variant: 'underline',
      css: {
        color: 'text',
      },
    },
  ],
  defaultVariants: {
    fullWidth: false,
    size: 'md',
    tone: 'white',
    variant: 'solid',
  },
});
