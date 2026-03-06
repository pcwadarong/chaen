import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { Textarea } from '@/shared/ui/textarea/textarea';

describe('Textarea', () => {
  it('내용 높이에 맞춰 textarea 높이를 자동 조정한다', () => {
    render(<Textarea aria-label="본문" defaultValue="" rows={1} />);

    const textarea = screen.getByLabelText('본문') as HTMLTextAreaElement;
    let nextScrollHeight = 28;

    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      get: () => nextScrollHeight,
    });

    fireEvent.change(textarea, { target: { value: '첫 줄' } });
    expect(textarea.style.height).toBe('28px');

    nextScrollHeight = 56;
    fireEvent.change(textarea, { target: { value: '첫 줄\n둘째 줄' } });
    expect(textarea.style.height).toBe('56px');
  });
});
