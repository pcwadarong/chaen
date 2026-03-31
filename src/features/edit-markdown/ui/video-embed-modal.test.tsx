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
      expect(uploadEditorVideo).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'project',
          file: expect.any(File),
          onProgress: expect.any(Function),
          signal: expect.any(AbortSignal),
        }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: '삽입' }));

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith({
        provider: 'upload',
        src: 'https://example.com/videos/demo.mp4',
      });
    });
  });

  it('영상 업로드가 진행 중일 때, VideoEmbedModal은 진행률을 표시하고 삽입을 비활성화해야 한다', async () => {
    const onApply = vi.fn();

    vi.mocked(uploadEditorVideo).mockImplementation(async ({ onProgress }) => {
      onProgress?.(42);
      return await new Promise(() => {});
    });

    render(<VideoEmbedModal contentType="article" onApply={onApply} />);

    fireEvent.click(screen.getByRole('button', { name: '영상' }));
    fireEvent.change(screen.getByLabelText('영상 업로드'), {
      target: {
        files: [new File(['binary'], 'demo.mp4', { type: 'video/mp4' })],
      },
    });

    expect(await screen.findByText('영상 업로드 중... 42%')).toBeTruthy();
    expect(screen.getByRole('button', { name: '삽입' })).toHaveProperty('disabled', true);
  });

  it('업로드 취소를 누르면, VideoEmbedModal은 진행 중인 업로드를 중단하고 취소 상태를 안내해야 한다', async () => {
    const onApply = vi.fn();

    vi.mocked(uploadEditorVideo).mockImplementation(
      ({ onProgress, signal }) =>
        new Promise((_, reject) => {
          onProgress?.(30);
          signal?.addEventListener(
            'abort',
            () => {
              const error = new Error('Video upload aborted');

              error.name = 'AbortError';
              reject(error);
            },
            { once: true },
          );
        }),
    );

    render(<VideoEmbedModal contentType="article" onApply={onApply} />);

    fireEvent.click(screen.getByRole('button', { name: '영상' }));
    fireEvent.change(screen.getByLabelText('영상 업로드'), {
      target: {
        files: [new File(['binary'], 'demo.mp4', { type: 'video/mp4' })],
      },
    });

    expect(await screen.findByText('영상 업로드 중... 30%')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '업로드 취소' }));

    await waitFor(() => {
      expect(screen.getByText('영상 업로드를 취소했습니다.')).toBeTruthy();
    });
    expect(onApply).not.toHaveBeenCalled();
  });
});
