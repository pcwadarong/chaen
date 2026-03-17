import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { SortOrderTabs } from '@/shared/ui/sort-order-tabs/sort-order-tabs';

import '@testing-library/jest-dom/vitest';

describe('SortOrderTabs', () => {
  it('latest/oldest 탭을 렌더링하고 선택을 전달한다', () => {
    const onChangeSort = vi.fn();

    render(
      <SortOrderTabs
        currentSort="latest"
        labels={{
          group: '정렬',
          latest: '최신순',
          oldest: '오래된순',
        }}
        onChangeSort={onChangeSort}
      />,
    );

    expect(screen.getByRole('tab', { name: '최신순' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '오래된순' })).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(screen.getByRole('tab', { name: '오래된순' }));

    expect(onChangeSort).toHaveBeenCalledWith('oldest');
  });
});
