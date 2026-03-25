import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { LinkEmbedPopover } from '@/features/edit-markdown/ui/link-embed-popover';

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

describe('LinkEmbedPopover', () => {
  it('입력값을 trim해서 선택한 mode와 함께 onApply에 전달한다', () => {
    const onApply = vi.fn();

    render(<LinkEmbedPopover onApply={onApply} />);

    fireEvent.change(screen.getByRole('textbox', { name: '링크 URL' }), {
      target: { value: '  https://openai.com  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: '하이퍼링크' }));

    expect(onApply).toHaveBeenCalledWith('https://openai.com', 'link', expect.any(Function));
  });
});
