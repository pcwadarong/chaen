import { createServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import { uploadImageFile } from './upload-image-file';

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createServiceRoleSupabaseClient: vi.fn(),
}));

describe('uploadImageFile', () => {
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

    await uploadImageFile({
      contentType: 'project',
      file,
    });

    expect(from).toHaveBeenCalledWith('project');
  });

  it('아티클 이미지는 article 버킷에 업로드한다', async () => {
    const file = new File(['binary'], 'thumb.png', { type: 'image/png' });

    await uploadImageFile({
      contentType: 'article',
      file,
    });

    expect(from).toHaveBeenCalledWith('article');
  });
});
