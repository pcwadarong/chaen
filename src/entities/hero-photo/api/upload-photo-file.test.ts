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

    upload.mockResolvedValue({ error: null });
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

  it('업로드한 사진을 photo 버킷에 저장하고 공개 URL 정보를 반환한다', async () => {
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
  });

  it('업로드 실패 시 photo 업로드 실패 에러를 던진다', async () => {
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
