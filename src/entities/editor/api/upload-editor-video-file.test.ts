// @vitest-environment node

import { uploadEditorVideoFile } from '@/entities/editor/api/upload-editor-video-file';
import { resolveStorageWriteSupabaseClient } from '@/shared/lib/supabase/storage-client';

vi.mock('@/shared/lib/supabase/storage-client', () => ({
  resolveStorageWriteSupabaseClient: vi.fn(),
}));

describe('uploadEditorVideoFile', () => {
  const upload = vi.fn();
  const getPublicUrl = vi.fn();
  const from = vi.fn();

  beforeEach(() => {
    upload.mockReset();
    getPublicUrl.mockReset();
    from.mockReset();

    upload.mockResolvedValue({ error: null });
    getPublicUrl.mockReturnValue({
      data: {
        publicUrl: 'https://example.com/article/videos/uploaded-demo.mp4',
      },
    });
    from.mockReturnValue({
      getPublicUrl,
      upload,
    });

    vi.mocked(resolveStorageWriteSupabaseClient).mockResolvedValue({
      storage: {
        from,
      },
    } as never);
  });

  it('contentType이 article일 때, uploadEditorVideoFile은 article 버킷의 videos 경로에 업로드하고 공개 URL을 반환해야 한다', async () => {
    const file = new File(['binary'], 'demo.mp4', { type: 'video/mp4' });

    await expect(
      uploadEditorVideoFile({
        contentType: 'article',
        file,
      }),
    ).resolves.toBe('https://example.com/article/videos/uploaded-demo.mp4');

    expect(from).toHaveBeenCalledWith('article');
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^videos\//),
      file,
      expect.objectContaining({
        contentType: 'video/mp4',
        upsert: false,
      }),
    );
  });

  it('확장자가 webm일 때, uploadEditorVideoFile은 file.type보다 확장자 기준 MIME을 우선 사용해야 한다', async () => {
    const file = new File(['binary'], 'demo.webm', { type: 'video/mp4' });

    await uploadEditorVideoFile({
      contentType: 'article',
      file,
    });

    expect(from).toHaveBeenCalledWith('article');
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^videos\//),
      file,
      expect.objectContaining({
        contentType: 'video/webm',
        upsert: false,
      }),
    );
  });

  it('storage 업로드가 실패하면, uploadEditorVideoFile은 원인 메시지를 포함한 예외를 던져야 한다', async () => {
    upload.mockResolvedValue({
      error: {
        message: 'Storage quota exceeded',
      },
    });

    await expect(
      uploadEditorVideoFile({
        contentType: 'project',
        file: new File(['binary'], 'demo.mp4', { type: 'video/mp4' }),
      }),
    ).rejects.toThrow('[video-upload] 영상 업로드 실패: Storage quota exceeded');
  });
});
