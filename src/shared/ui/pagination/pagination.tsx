import React from 'react';
import { css } from 'styled-system/css';

import { Button } from '@/shared/ui/button/button';

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
              <Button
                aria-current={isCurrent ? 'page' : undefined}
                className={isCurrent ? currentPaginationButtonClass : paginationButtonClass}
                disabled={isCurrent}
                onClick={() => onPageChange(page)}
                size="xs"
                tone={isCurrent ? 'primary' : 'white'}
                type="button"
                variant={isCurrent ? 'solid' : 'ghost'}
              >
                {page}
              </Button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

const paginationButtonClass = css({
  minWidth: '[2.25rem]',
  fontWeight: 'medium',
  color: 'muted',
  _hover: {
    color: 'primary',
    background: 'primarySubtle',
  },
  _focusVisible: {
    color: 'primary',
    background: 'primarySubtle',
  },
});

const currentPaginationButtonClass = css({
  minWidth: '[2.25rem]',
  fontWeight: 'semibold',
  _disabled: {
    cursor: 'default',
    opacity: 1,
  },
  '&[aria-disabled="true"]': {
    cursor: 'default',
    opacity: 1,
  },
});

const paginationListClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1',
  flexWrap: 'wrap',
});
