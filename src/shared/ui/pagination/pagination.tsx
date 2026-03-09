import React from 'react';

import {
  paginationButtonRecipe,
  paginationListClass,
} from '@/shared/ui/pagination/pagination.recipe';

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
