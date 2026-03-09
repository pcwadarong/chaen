import { css, cva } from 'styled-system/css';

/**
 * 미디어 카드의 공통 베이스 클래스를 정의합니다.
 */
export const contentCardRecipe = cva({
  base: {
    minHeight: '[19rem]',
    height: 'full',
    display: 'grid',
    alignContent: 'start',
    gap: '0',
    borderRadius: 'lg',
    border: '[1px solid rgb(var(--color-border) / 0.22)]',
    backgroundColor: '[rgb(var(--color-surface-muted) / 0.5)]',
    overflow: 'hidden',
    transition: '[box-shadow 220ms ease, transform 220ms ease]',
    _groupHover: {
      boxShadow: '[0 4px 16px rgb(var(--color-black) / 0.14)]',
      transform: '[translateY(-1px)]',
    },
    _groupFocusVisible: {
      boxShadow: '[0 4px 16px rgb(var(--color-black) / 0.14)]',
      transform: '[translateY(-1px)]',
    },
  },
});

export const contentCardLinkClass = css({
  display: 'block',
  height: 'full',
  textDecoration: 'none',
  color: 'text',
});
