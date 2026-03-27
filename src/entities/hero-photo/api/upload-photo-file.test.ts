/* @vitest-environment node */

import { uploadPhotoFile } from '@/entities/hero-photo/api/upload-photo-file';
import { createServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createServiceRoleSupabaseClient: vi.fn(),
}));

describe('uploadPhotoFile', () => {
  const getPublicUrl = vi.fn();
  const upload = vi.fn();
  const from = vi.fn();

  beforeEach(() => {
    getPublicUrl.mockReset();
    upload.mockReset();
    from.mockReset();

    upload.mockResolvedValue({
      data: {
        created_at: '2026-03-27T09:00:00.000Z',
      },
      error: null,
    });
    getPublicUrl.mockImplementation((filePath: string) => ({
      data: {
        publicUrl: `https://example.com/${filePath}`,
      },
    }));
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('유효한 사진 파일이 주어질 때, uploadPhotoFile은 photo 버킷에 저장하고 공개 URL 정보를 반환해야 한다', async () => {
    const file = new File(['binary'], 'sample.jpeg', { type: 'image/jpeg' });

    const result = await uploadPhotoFile({
      file,
    });

    expect(from).toHaveBeenCalledWith('photo');
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^[0-9a-f-]+-sample\.jpeg$/),
      file,
      expect.objectContaining({
        contentType: 'image/jpeg',
        upsert: false,
      }),
    );
    expect(result.fileName).toMatch(/^[0-9a-f-]+-sample\.jpeg$/);
    expect(result.filePath).toBe(result.fileName);
    expect(result.publicUrl).toBe(`https://example.com/${result.fileName}`);
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.size).toBe(file.size);
    expect(result.createdAt).toBe('2026-03-27T09:00:00.000Z');
  });

  it('Storage 업로드가 실패할 때, uploadPhotoFile은 photo 업로드 실패 에러를 던져야 한다', async () => {
    upload.mockResolvedValue({
      error: {
        message: 'upload failed',
      },
    });

    await expect(
      uploadPhotoFile({
        file: new File(['binary'], 'broken.png', { type: 'image/png' }),
      }),
    ).rejects.toThrow('[photo-file] 사진 업로드 실패: upload failed');
  });
});
