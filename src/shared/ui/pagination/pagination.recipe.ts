import { css, cva } from 'styled-system/css';

/**
 * 페이지네이션 버튼의 공통 스타일과 현재 페이지 variant를 정의합니다.
 */
export const paginationButtonRecipe = cva({
  base: {
    minWidth: '[2.25rem]',
    minHeight: '[2.25rem]',
    px: '2',
    py: '1',
    border: '[0]',
    borderRadius: 'pill',
    background: 'transparent',
    color: 'muted',
    fontSize: '14',
    fontWeight: 'medium',
    transition: 'colors',
    _hover: {
      color: 'primary',
      background: '[rgb(var(--color-primary) / 0.08)]',
      boxShadow: '[0 0 0 3px rgb(var(--color-primary) / 0.12)]',
    },
    _focusVisible: {
      outline: 'none',
      color: 'primary',
      background: '[rgb(var(--color-primary) / 0.08)]',
      boxShadow: '[0 0 0 3px rgb(var(--color-primary) / 0.12)]',
    },
    _disabled: {
      cursor: 'default',
    },
    '&[aria-disabled="true"]': {
      cursor: 'default',
    },
  },
  variants: {
    current: {
      true: {
        color: 'primary',
        background: '[rgb(var(--color-primary) / 0.1)]',
        fontWeight: 'semibold',
      },
      false: {},
    },
  },
  defaultVariants: {
    current: false,
  },
});

export const paginationListClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1',
  flexWrap: 'wrap',
});
