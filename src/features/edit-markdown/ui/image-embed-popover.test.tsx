import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { EDITOR_ERROR_MESSAGE } from '@/entities/editor/model/editor-error';
import { ImageEmbedPopover } from '@/features/edit-markdown/ui/image-embed-popover';
import { uploadEditorImage } from '@/shared/lib/image/upload-editor-image';

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

vi.mock('@/shared/lib/image/upload-editor-image', () => ({
  uploadEditorImage: vi.fn(),
}));

describe('ImageEmbedPopover', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('입력값을 trim해서 onApply에 전달한다', () => {
    const onApply = vi.fn();

    render(<ImageEmbedPopover contentType="article" onApply={onApply} />);

    fireEvent.change(screen.getByRole('textbox', { name: '이미지' }), {
      target: { value: '  https://example.com/image.png  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: '삽입' }));

    expect(onApply).toHaveBeenCalledWith('https://example.com/image.png', expect.any(Function));
  });

  it('파일 업로드가 성공하면 입력값에 업로드 URL을 채운다', async () => {
    vi.mocked(uploadEditorImage).mockResolvedValue('https://example.com/uploaded.webp');

    render(<ImageEmbedPopover contentType="article" onApply={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('이미지 파일 업로드'), {
      target: {
        files: [new File(['binary'], 'inline.png', { type: 'image/png' })],
      },
    });

    await waitFor(() => {
      expect((screen.getByRole('textbox', { name: '이미지' }) as HTMLInputElement).value).toBe(
        'https://example.com/uploaded.webp',
      );
    });

    expect(uploadEditorImage).toHaveBeenCalledWith({
      contentType: 'article',
      file: expect.objectContaining({ name: 'inline.png' }),
      imageKind: 'content',
    });
  });

  it('파일 업로드가 실패하면 에러 메시지를 노출한다', async () => {
    vi.mocked(uploadEditorImage).mockRejectedValue(new Error('upload failed'));

    render(<ImageEmbedPopover contentType="article" onApply={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('이미지 파일 업로드'), {
      target: {
        files: [new File(['binary'], 'inline.png', { type: 'image/png' })],
      },
    });

    expect(await screen.findByText(EDITOR_ERROR_MESSAGE.imageUploadFailedWithRetry)).toBeTruthy();
  });
});
