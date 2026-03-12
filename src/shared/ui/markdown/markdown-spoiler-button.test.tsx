import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { MarkdownSpoilerButton } from '@/shared/ui/markdown/markdown-spoiler-button';

describe('MarkdownSpoilerButton', () => {
  it('button으로 렌더링되고 클릭으로 열고 닫을 수 있다', () => {
    render(<MarkdownSpoilerButton>스포일러</MarkdownSpoilerButton>);

    const spoilerButton = screen.getByRole('button', { name: /스포일러/ });

    expect(spoilerButton.getAttribute('aria-expanded')).toBe('false');
    expect(spoilerButton.getAttribute('aria-describedby')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('숨겨진 내용');

    fireEvent.click(spoilerButton);

    expect(screen.getByRole('button', { name: /스포일러/ })).toBeTruthy();
    expect(spoilerButton.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('status').textContent).toContain('열렸습니다');
  });
});
