import { uploadEditorImageFile } from '@/entities/editor/api/upload-editor-image-file';
import { createServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createServiceRoleSupabaseClient: vi.fn(),
}));

describe('uploadEditorImageFile', () => {
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
        publicUrl: 'https://example.com/thumbnails/uploaded-thumb.webp',
      },
    });
    from.mockReturnValue({
      getPublicUrl,
      upload,
    });

    vi.mocked(createServiceRoleSupabaseClient).mockReturnValue({
      storage: {
        from,
      },
    } as never);
  });

  it('프로젝트 이미지는 project 버킷에 업로드한다', async () => {
    const file = new File(['binary'], 'thumb.png', { type: 'image/png' });

    await uploadEditorImageFile({
      contentType: 'project',
      file,
      imageKind: 'thumbnail',
    });

    expect(from).toHaveBeenCalledWith('project');
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^thumbnails\//),
      file,
      expect.any(Object),
    );
  });

  it('본문 이미지는 images 경로에 업로드한다', async () => {
    const file = new File(['binary'], 'thumb.png', { type: 'image/png' });

    await uploadEditorImageFile({
      contentType: 'article',
      file,
      imageKind: 'content',
    });

    expect(from).toHaveBeenCalledWith('article');
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^images\//),
      file,
      expect.any(Object),
    );
  });

  it('resume 이미지는 resume 버킷에 업로드한다', async () => {
    const file = new File(['binary'], 'resume-image.png', { type: 'image/png' });

    await uploadEditorImageFile({
      contentType: 'resume',
      file,
      imageKind: 'content',
    });

    expect(from).toHaveBeenCalledWith('resume');
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^images\//),
      file,
      expect.any(Object),
    );
  });
});
