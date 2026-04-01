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

describe('FileEmbedPopover', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('업로드한 첨부 파일 메타데이터를 onApply에 전달한다', async () => {
    const onApply = vi.fn();
    const onUploadFile = vi.fn(async () => ({
      contentType: 'application/pdf',
      fileName: 'resume.pdf',
      fileSize: 2048,
      url: 'https://example.com/resume.pdf',
    }));

    render(
      <FileEmbedPopover contentType="article" onApply={onApply} onUploadFile={onUploadFile} />,
    );

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

  it('업로드 실패 시 에러 메시지를 노출하고 onApply를 호출하지 않는다', async () => {
    const onApply = vi.fn();
    const onUploadFile = vi.fn().mockRejectedValueOnce(new Error('upload failed'));

    render(
      <FileEmbedPopover contentType="article" onApply={onApply} onUploadFile={onUploadFile} />,
    );

    fireEvent.change(screen.getByLabelText('첨부 파일 업로드'), {
      target: {
        files: [new File(['pdf'], 'resume.pdf', { type: 'application/pdf' })],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain(
        '파일 업로드에 실패했습니다. 다시 시도해주세요.',
      );
    });

    fireEvent.click(screen.getByRole('button', { name: '삽입' }));

    expect(onApply).not.toHaveBeenCalled();
  });

  it('업로드 실패 후 다시 파일을 고르면 재시도 후 삽입할 수 있다', async () => {
    const onApply = vi.fn();
    const onUploadFile = vi
      .fn()
      .mockRejectedValueOnce(new Error('upload failed'))
      .mockResolvedValue({
        contentType: 'application/pdf',
        fileName: 'resume.pdf',
        fileSize: 2048,
        url: 'https://example.com/resume.pdf',
      });

    render(
      <FileEmbedPopover contentType="article" onApply={onApply} onUploadFile={onUploadFile} />,
    );

    fireEvent.change(screen.getByLabelText('첨부 파일 업로드'), {
      target: {
        files: [new File(['pdf'], 'resume.pdf', { type: 'application/pdf' })],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain(
        '파일 업로드에 실패했습니다. 다시 시도해주세요.',
      );
    });

    fireEvent.change(screen.getByLabelText('첨부 파일 업로드'), {
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
