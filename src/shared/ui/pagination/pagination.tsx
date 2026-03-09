import React from 'react';
import { css, cva } from 'styled-system/css';

type PaginationProps = {
  ariaLabel: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
};

/**
 * 심플한 숫자형 페이지네이션을 렌더링합니다.
 * 현재 페이지는 강조하고, 나머지 페이지는 borderless hover 스타일을 사용합니다.
 */
export const Pagination = ({
  ariaLabel,
  currentPage,
  onPageChange,
  totalPages,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label={ariaLabel}>
      <ol className={paginationListClass}>
        {pages.map(page => {
          const isCurrent = page === currentPage;

          return (
            <li key={page}>
              <button
                aria-current={isCurrent ? 'page' : undefined}
                className={paginationButtonRecipe({ current: isCurrent })}
                disabled={isCurrent}
                onClick={() => onPageChange(page)}
                type="button"
              >
                {page}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

const paginationButtonRecipe = cva({
  base: {
    minWidth: '[2.25rem]',
    minHeight: '[2.25rem]',
    px: '2',
    py: '1',
    border: '[0]',
    borderRadius: 'full',
    background: 'transparent',
    color: 'muted',
    fontSize: 'sm',
    fontWeight: 'medium',
    transition: 'colors',
    _hover: {
      color: 'primary',
      background: 'primarySubtle',
      boxShadow: '[0 0 0 3px var(--colors-focus-ring)]',
    },
    _focusVisible: {
      outline: 'none',
      color: 'primary',
      background: 'primarySubtle',
      boxShadow: '[0 0 0 3px var(--colors-focus-ring)]',
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
        background: 'primaryMuted',
        fontWeight: 'semibold',
      },
      false: {},
    },
  },
  defaultVariants: {
    current: false,
  },
});

const paginationListClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1',
  flexWrap: 'wrap',
});
