import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { Pagination } from '@/shared/ui/pagination/pagination';

describe('Pagination', () => {
  it('페이지가 1개 이하면 렌더링하지 않는다', () => {
    const { container } = render(
      <Pagination
        ariaLabel="댓글 페이지네이션"
        currentPage={1}
        onPageChange={vi.fn()}
        totalPages={1}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('현재 페이지를 aria-current로 표시하고 다른 페이지 클릭만 전달한다', () => {
    const onPageChange = vi.fn();

    render(
      <Pagination
        ariaLabel="댓글 페이지네이션"
        currentPage={2}
        onPageChange={onPageChange}
        totalPages={4}
      />,
    );

    const currentPageButton = screen.getByRole('button', { name: '2' });
    const nextPageButton = screen.getByRole('button', { name: '3' });

    expect(currentPageButton.getAttribute('aria-current')).toBe('page');
    expect(currentPageButton.hasAttribute('disabled')).toBe(true);

    fireEvent.click(nextPageButton);

    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(onPageChange).toHaveBeenCalledTimes(1);
  });
});
