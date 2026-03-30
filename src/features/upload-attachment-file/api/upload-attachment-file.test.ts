import { uploadAttachmentFile } from '@/features/upload-attachment-file/api/upload-attachment-file';
import { createServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createServiceRoleSupabaseClient: vi.fn(),
}));

describe('uploadAttachmentFile', () => {
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
        publicUrl: 'https://example.com/article/attachments/uploaded-resume.pdf',
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

  it('첨부 파일은 file 버킷의 contentType별 attachments 경로에 업로드한다', async () => {
    const file = new File(['binary'], 'resume.pdf', { type: 'application/pdf' });

    await uploadAttachmentFile({
      contentType: 'article',
      file,
    });

    expect(from).toHaveBeenCalledWith('file');
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^article\/attachments\//),
      file,
      expect.objectContaining({
        contentType: 'application/pdf',
        upsert: false,
      }),
    );
  });
});
