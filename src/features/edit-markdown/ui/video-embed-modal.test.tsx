import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { uploadEditorVideo } from '@/entities/editor/api/upload-editor-video';
import { VideoEmbedModal } from '@/features/edit-markdown/ui/video-embed-modal';

vi.mock('@/entities/editor/api/upload-editor-video', () => ({
  uploadEditorVideo: vi.fn(),
}));

describe('VideoEmbedModal', () => {
  it('유효한 동영상 URL이 주어지면, VideoEmbedModal은 추출된 video id로 onApply를 호출해야 한다', async () => {
    const onApply = vi.fn();

    render(<VideoEmbedModal contentType="article" onApply={onApply} />);

    fireEvent.click(screen.getByRole('button', { name: '영상' }));
    fireEvent.change(screen.getByRole('textbox', { name: '동영상 URL' }), {
      target: { value: 'https://youtu.be/dQw4w9WgXcQ/extra' },
    });
    fireEvent.click(screen.getByRole('button', { name: '삽입' }));

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith({
        provider: 'youtube',
        videoId: 'dQw4w9WgXcQ',
      });
    });
  });

  it('유효하지 않은 동영상 URL이 주어지면, VideoEmbedModal은 onApply를 호출하지 않아야 한다', async () => {
    const onApply = vi.fn();

    render(<VideoEmbedModal contentType="article" onApply={onApply} />);

    fireEvent.click(screen.getByRole('button', { name: '영상' }));
    fireEvent.change(screen.getByRole('textbox', { name: '동영상 URL' }), {
      target: { value: 'https://example.com/not-a-video' },
    });
    fireEvent.click(screen.getByRole('button', { name: '삽입' }));

    await waitFor(() => {
      expect(onApply).not.toHaveBeenCalled();
    });
  });

  it('영상 파일 업로드가 성공하면, VideoEmbedModal은 upload provider payload로 onApply를 호출해야 한다', async () => {
    const onApply = vi.fn();

    vi.mocked(uploadEditorVideo).mockResolvedValue('https://example.com/videos/demo.mp4');

    render(<VideoEmbedModal contentType="project" onApply={onApply} />);

    fireEvent.click(screen.getByRole('button', { name: '영상' }));
    fireEvent.change(screen.getByLabelText('영상 업로드'), {
      target: {
        files: [new File(['binary'], 'demo.mp4', { type: 'video/mp4' })],
      },
    });

    await waitFor(() => {
      expect(uploadEditorVideo).toHaveBeenCalledWith({
        contentType: 'project',
        file: expect.any(File),
      });
    });

    fireEvent.click(screen.getByRole('button', { name: '삽입' }));

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith({
        provider: 'upload',
        src: 'https://example.com/videos/demo.mp4',
      });
    });
  });
});
