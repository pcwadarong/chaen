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
  it('trim된 URL 입력값이 주어지면, LinkEmbedPopover는 정규화된 값과 선택한 mode로 onApply를 호출해야 한다', () => {
    const onApply = vi.fn();

    render(<LinkEmbedPopover onApply={onApply} />);

    fireEvent.change(screen.getByRole('textbox', { name: '링크 URL' }), {
      target: { value: '  https://openai.com  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: '하이퍼링크' }));

    expect(onApply).toHaveBeenCalledWith('https://openai.com', 'link', expect.any(Function));
  });

  it('공백만 입력되면, LinkEmbedPopover는 onApply를 호출하지 않아야 한다', () => {
    const onApply = vi.fn();

    render(<LinkEmbedPopover onApply={onApply} />);

    fireEvent.change(screen.getByRole('textbox', { name: '링크 URL' }), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: '하이퍼링크' }));

    expect(onApply).not.toHaveBeenCalled();
  });

  it('custom labels가 주어지면, LinkEmbedPopover는 override된 텍스트를 렌더링해야 한다', () => {
    const onApply = vi.fn();

    render(
      <LinkEmbedPopover
        labels={{
          cardButtonLabel: '카드 링크',
          hyperlinkButtonLabel: '일반 링크',
          panelLabel: '링크 넣기',
          previewButtonLabel: '미리보기 링크',
          triggerAriaLabel: '링크 추가',
          triggerTooltip: '링크 추가',
          urlInputAriaLabel: '커스텀 링크 URL',
          urlPlaceholder: 'https://custom.example.com',
        }}
        onApply={onApply}
      />,
    );

    expect(screen.getByRole('button', { name: '링크 추가' })).toBeTruthy();
    expect(
      screen.getByRole('textbox', { name: '커스텀 링크 URL' }).getAttribute('placeholder'),
    ).toBe('https://custom.example.com');
    expect(screen.getByRole('button', { name: '미리보기 링크' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '일반 링크' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '카드 링크' })).toBeTruthy();
  });
});
