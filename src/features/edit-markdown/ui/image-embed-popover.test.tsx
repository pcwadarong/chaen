import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { ImageEmbedPopover } from '@/features/edit-markdown/ui/image-embed-popover';

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

describe('ImageEmbedPopover', () => {
  it('입력값을 trim해서 onApply에 전달한다', () => {
    const onApply = vi.fn();

    render(<ImageEmbedPopover contentType="article" onApply={onApply} />);

    fireEvent.change(screen.getByRole('textbox', { name: '이미지' }), {
      target: { value: '  https://example.com/image.png  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: '삽입' }));

    expect(onApply).toHaveBeenCalledWith('https://example.com/image.png', expect.any(Function));
  });
});
