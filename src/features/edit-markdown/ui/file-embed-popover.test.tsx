import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { FileEmbedPopover } from '@/features/edit-markdown/ui/file-embed-popover';

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

vi.mock('@/entities/editor/api/upload-editor-file', () => ({
  uploadEditorFile: vi.fn(async () => ({
    contentType: 'application/pdf',
    fileName: 'resume.pdf',
    fileSize: 2048,
    url: 'https://example.com/resume.pdf',
  })),
}));

describe('FileEmbedPopover', () => {
  it('업로드한 첨부 파일 메타데이터를 onApply에 전달한다', async () => {
    const onApply = vi.fn();

    render(<FileEmbedPopover contentType="article" onApply={onApply} />);

    const fileInput = screen.getByLabelText('첨부 파일 업로드');
    fireEvent.change(fileInput, {
      target: {
        files: [new File(['pdf'], 'resume.pdf', { type: 'application/pdf' })],
      },
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('resume.pdf')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: '삽입' }));

    expect(onApply).toHaveBeenCalledWith(
      {
        contentType: 'application/pdf',
        fileName: 'resume.pdf',
        fileSize: 2048,
        url: 'https://example.com/resume.pdf',
      },
      expect.any(Function),
    );
  });
});
