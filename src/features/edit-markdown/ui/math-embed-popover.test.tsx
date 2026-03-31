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
  it('분수 템플릿 버튼을 누르면 기본 분수 수식이 입력된다', () => {
    render(<MathEmbedPopover onApply={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '분수' }));

    const textbox = screen.getByRole('textbox', { name: 'LaTeX 수식' }) as HTMLTextAreaElement;

    expect(textbox.value).toBe('\\frac{a}{b}');
    expect(document.activeElement).toBe(textbox);
    expect(textbox.selectionStart).toBe('\\frac{'.length);
    expect(textbox.selectionEnd).toBe('\\frac{'.length + 1);
  });

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

  it('cases 템플릿을 선택한 뒤 블록 수식으로 삽입할 수 있다', () => {
    const onApply = vi.fn();

    render(<MathEmbedPopover onApply={onApply} />);

    fireEvent.click(screen.getByRole('button', { name: 'cases' }));
    fireEvent.click(screen.getByRole('button', { name: '블록' }));

    expect(onApply).toHaveBeenCalledWith(
      '\\begin{cases} x, &x \\ge 0 \\\\ -x, &x < 0 \\end{cases}',
      true,
      expect.any(Function),
    );
  });

  it('cases 템플릿 버튼을 누르면 본문 영역이 바로 선택된다', () => {
    render(<MathEmbedPopover onApply={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'cases' }));

    const textbox = screen.getByRole('textbox', { name: 'LaTeX 수식' }) as HTMLTextAreaElement;

    expect(textbox.value.slice(textbox.selectionStart, textbox.selectionEnd)).toBe(
      ' x, &x \\ge 0 \\\\ -x, &x < 0',
    );
  });

  it('적분 템플릿 버튼을 누르면 적분 대상 함수 구간이 바로 선택된다', () => {
    render(<MathEmbedPopover onApply={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '적분' }));

    const textbox = screen.getByRole('textbox', { name: 'LaTeX 수식' }) as HTMLTextAreaElement;

    expect(textbox.value).toBe('\\int_{a}^{b} f(x) \\, dx');
    expect(textbox.value.slice(textbox.selectionStart, textbox.selectionEnd)).toBe('f(x)');
  });
});
