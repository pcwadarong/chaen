import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { TextColorPopover } from '@/features/edit-markdown/ui/text-color-popover';

type PopoverMockProps = {
  children: React.ReactNode | ((args: { closePopover: () => void }) => React.ReactNode);
  triggerAriaLabel?: string;
  triggerContent?: React.ReactNode;
};

vi.mock('@/shared/ui/popover/popover', () => ({
  Popover: ({ children, triggerAriaLabel, triggerContent }: PopoverMockProps) => (
    <div>
      <button aria-label={triggerAriaLabel} type="button">
        {triggerContent ?? triggerAriaLabel}
      </button>
      {typeof children === 'function' ? children({ closePopover: vi.fn() }) : children}
    </div>
  ),
}));

describe('TextColorPopover', () => {
  it('custom labels가 주어지면, TextColorPopover는 override된 trigger 라벨과 옵션 라벨을 렌더링해야 한다', () => {
    const onApply = vi.fn();

    render(
      <TextColorPopover
        labels={{
          getOptionAriaLabel: label => `${label} 커스텀`,
          panelLabel: '커스텀 글자색',
          triggerAriaLabel: '커스텀 글자색 열기',
          triggerTooltip: '커스텀 글자색 툴팁',
        }}
        onApply={onApply}
      />,
    );

    expect(screen.getByRole('button', { name: '커스텀 글자색 열기' })).toBeTruthy();

    fireEvent.click(screen.getAllByRole('button', { name: /커스텀$/ })[0] as HTMLButtonElement);

    expect(onApply).toHaveBeenCalled();
  });
});
