import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { MarkdownMermaid } from '@/shared/ui/markdown/markdown-mermaid';

const initialize = vi.fn();
const renderMermaid = vi.fn();

vi.mock('mermaid', () => ({
  default: {
    initialize,
    render: renderMermaid,
  },
}));

describe('MarkdownMermaid', () => {
  beforeEach(() => {
    initialize.mockReset();
    renderMermaid.mockReset();
  });

  it('유효한 mermaid 원본이 주어지면, MarkdownMermaid는 SVG 다이어그램을 렌더링해야 한다', async () => {
    renderMermaid.mockResolvedValue({
      svg: '<svg aria-label="Mermaid diagram"><g /></svg>',
    });

    const { container } = render(<MarkdownMermaid chart={'flowchart TD\nA-->B'} />);

    await waitFor(() => {
      expect(container.querySelector('svg[aria-label="Mermaid diagram"]')).toBeTruthy();
    });

    expect(initialize).toHaveBeenCalled();
    expect(renderMermaid).toHaveBeenCalledWith(
      expect.stringMatching(/^markdown-mermaid-/),
      'flowchart TD\nA-->B',
    );
  });

  it('유효한 mermaid 원본이 주어지면, MarkdownMermaid는 원본 코드 보기 토글로 다이어그램과 원본을 함께 확인할 수 있어야 한다', async () => {
    renderMermaid.mockResolvedValue({
      svg: '<svg aria-label="Mermaid diagram"><g /></svg>',
    });

    const { container } = render(<MarkdownMermaid chart={'flowchart TD\nA-->B'} />);

    await waitFor(() => {
      expect(container.querySelector('svg[aria-label="Mermaid diagram"]')).toBeTruthy();
    });

    expect(screen.queryByText('flowchart TD\nA-->B')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '원본 코드 보기' }));

    expect(container.querySelector('pre')?.textContent).toBe('flowchart TD\nA-->B');
    expect(container.querySelector('svg[aria-label="Mermaid diagram"]')).toBeTruthy();
  });

  it('렌더링 오류가 발생하면, MarkdownMermaid는 오류 메시지와 원본 코드를 fallback으로 보여줘야 한다', async () => {
    renderMermaid.mockRejectedValue(new Error('parse failed'));

    const { container } = render(<MarkdownMermaid chart={'flowchart TD\nA-->B'} />);

    expect((await screen.findByRole('alert')).textContent).toContain('Mermaid 렌더링 오류');
    expect(container.querySelector('pre')?.textContent).toBe('flowchart TD\nA-->B');
  });
});
