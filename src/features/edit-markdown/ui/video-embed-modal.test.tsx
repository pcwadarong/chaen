import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { VideoEmbedModal } from '@/features/edit-markdown/ui/video-embed-modal';

describe('VideoEmbedModal', () => {
  it('유효한 동영상 URL이 주어지면, VideoEmbedModal은 추출된 video id로 onApply를 호출해야 한다', async () => {
    const onApply = vi.fn();

    render(<VideoEmbedModal onApply={onApply} />);

    fireEvent.click(screen.getByRole('button', { name: '영상' }));
    fireEvent.change(screen.getByRole('textbox', { name: '동영상 URL' }), {
      target: { value: 'https://youtu.be/dQw4w9WgXcQ/extra' },
    });
    fireEvent.click(screen.getByRole('button', { name: '삽입' }));

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith('dQw4w9WgXcQ');
    });
  });

  it('유효하지 않은 동영상 URL이 주어지면, VideoEmbedModal은 onApply를 호출하지 않아야 한다', async () => {
    const onApply = vi.fn();

    render(<VideoEmbedModal onApply={onApply} />);

    fireEvent.click(screen.getByRole('button', { name: '영상' }));
    fireEvent.change(screen.getByRole('textbox', { name: '동영상 URL' }), {
      target: { value: 'https://example.com/not-a-video' },
    });
    fireEvent.click(screen.getByRole('button', { name: '삽입' }));

    await waitFor(() => {
      expect(onApply).not.toHaveBeenCalled();
    });
  });
});
