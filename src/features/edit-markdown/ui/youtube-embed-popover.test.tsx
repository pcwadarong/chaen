import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { YoutubeEmbedPopover } from '@/features/edit-markdown/ui/youtube-embed-popover';

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

describe('YoutubeEmbedPopover', () => {
  it('유효한 YouTube URL이면 추출한 video id로 onApply를 호출한다', () => {
    const onApply = vi.fn();

    render(<YoutubeEmbedPopover onApply={onApply} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'YouTube URL' }), {
      target: { value: 'https://youtu.be/dQw4w9WgXcQ/extra' },
    });
    fireEvent.click(screen.getByRole('button', { name: '삽입' }));

    expect(onApply).toHaveBeenCalledWith('dQw4w9WgXcQ', expect.any(Function));
  });
});
