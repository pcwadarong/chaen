'use client';

import { css } from '@emotion/react';
import React from 'react';

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
      <ol css={listStyle}>
        {pages.map(page => {
          const isCurrent = page === currentPage;

          return (
            <li key={page}>
              <button
                aria-current={isCurrent ? 'page' : undefined}
                css={[pageButtonStyle, isCurrent ? currentPageButtonStyle : undefined]}
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

const listStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  flex-wrap: wrap;
`;

const pageButtonStyle = css`
  min-width: 2.25rem;
  min-height: 2.25rem;
  padding: var(--space-1) var(--space-2);
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: rgb(var(--color-muted));
  font-size: var(--font-size-14);
  font-weight: var(--font-weight-medium);
  transition:
    color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease;

  &:hover:not(:disabled):not([aria-disabled='true']),
  &:focus-visible:not(:disabled):not([aria-disabled='true']) {
    color: rgb(var(--color-primary));
    background: rgb(var(--color-primary) / 0.08);
    outline: none;
    box-shadow: 0 0 0 3px rgb(var(--color-primary) / 0.12);
  }

  &:disabled,
  &[aria-disabled='true'] {
    cursor: default;
  }
`;

const currentPageButtonStyle = css`
  color: rgb(var(--color-primary));
  background: rgb(var(--color-primary) / 0.1);
  font-weight: var(--font-weight-semibold);
`;
