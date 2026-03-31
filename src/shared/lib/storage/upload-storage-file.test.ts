// @vitest-environment node

import { uploadStorageFile } from '@/shared/lib/storage/upload-storage-file';

describe('uploadStorageFile', () => {
  const upload = vi.fn();
  const getPublicUrl = vi.fn();
  const from = vi.fn();
  const supabase = {
    storage: {
      from,
    },
  };

  beforeEach(() => {
    upload.mockReset();
    getPublicUrl.mockReset();
    from.mockReset();

    upload.mockResolvedValue({
      data: {
        created_at: '2026-03-31T00:00:00.000Z',
      },
      error: null,
    });
    getPublicUrl.mockReturnValue({
      data: {
        publicUrl: 'https://example.com/attachments/demo.pdf',
      },
    });
    from.mockReturnValue({
      getPublicUrl,
      upload,
    });
  });

  it('includePublicUrl 옵션이 켜져 있을 때, uploadStorageFile은 upload 결과와 public URL을 함께 반환해야 한다', async () => {
    const result = await uploadStorageFile({
      bucketName: 'article',
      contentType: 'application/pdf',
      errorPrefix: 'attachment-upload',
      file: new File(['binary'], 'demo.pdf', { type: 'application/pdf' }),
      filePath: 'attachments/demo.pdf',
      includePublicUrl: true,
      supabase,
    });

    expect(from).toHaveBeenCalledWith('article');
    expect(upload).toHaveBeenCalledWith(
      'attachments/demo.pdf',
      expect.any(File),
      expect.objectContaining({
        contentType: 'application/pdf',
        upsert: false,
      }),
    );
    expect(result).toEqual({
      filePath: 'attachments/demo.pdf',
      publicUrl: 'https://example.com/attachments/demo.pdf',
      uploadData: {
        created_at: '2026-03-31T00:00:00.000Z',
      },
    });
  });

  it('업로드가 실패할 때, uploadStorageFile은 prefix가 포함된 예외를 던져야 한다', async () => {
    upload.mockResolvedValue({
      data: null,
      error: {
        message: 'quota exceeded',
      },
    });

    await expect(
      uploadStorageFile({
        bucketName: 'resume',
        contentType: 'application/pdf',
        errorPrefix: 'pdf-file',
        file: new File(['binary'], 'resume.pdf', { type: 'application/pdf' }),
        filePath: 'pdf/resume.pdf',
        supabase,
      }),
    ).rejects.toThrow('[pdf-file] 파일 업로드 실패: quota exceeded');
  });
});
