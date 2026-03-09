import { cva } from 'styled-system/css';

/**
 * 공통 여러 줄 입력 필드 스타일을 정의합니다.
 */
export const textareaRecipe = cva({
  base: {
    width: 'full',
    px: '3',
    py: '2',
    borderRadius: 'md',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '[rgb(var(--color-border) / 0.3)]',
    backgroundColor: 'surface',
    color: 'text',
    resize: 'vertical',
    transition: 'colors',
    _placeholder: {
      color: '[rgb(var(--color-muted) / 0.62)]',
    },
    _hover: {
      borderColor: '[rgb(var(--color-border) / 0.44)]',
    },
    _focusVisible: {
      outline: 'none',
      borderColor: '[rgb(var(--color-primary) / 0.42)]',
      boxShadow: '[0 0 0 3px rgb(var(--color-primary) / 0.14)]',
    },
    _disabled: {
      cursor: 'not-allowed',
      opacity: 0.56,
    },
    '&[aria-disabled="true"]': {
      cursor: 'not-allowed',
      opacity: 0.56,
    },
  },
  variants: {
    autoResize: {
      true: {
        resize: 'none',
        overflow: 'hidden',
      },
      false: {},
    },
  },
  defaultVariants: {
    autoResize: true,
  },
});
