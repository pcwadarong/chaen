import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { MathEmbedPopover } from '@/features/edit-markdown/ui/math-embed-popover';

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

describe('MathEmbedPopover', () => {
  it('수식 입력값을 inline 수식으로 onApply에 전달한다', () => {
    const onApply = vi.fn();

    render(<MathEmbedPopover onApply={onApply} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'LaTeX 수식' }), {
      target: { value: 'a^2 + b^2 = c^2' },
    });
    fireEvent.click(screen.getByRole('button', { name: '인라인' }));

    expect(onApply).toHaveBeenCalledWith('a^2 + b^2 = c^2', false, expect.any(Function));
  });

  it('공백 입력만 있으면 삽입 콜백을 호출하지 않는다', () => {
    const onApply = vi.fn();

    render(<MathEmbedPopover onApply={onApply} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'LaTeX 수식' }), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: '블록' }));

    expect(onApply).not.toHaveBeenCalled();
  });
});
