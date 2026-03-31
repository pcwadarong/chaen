// @vitest-environment node

import { uploadEditorAttachmentFile } from '@/entities/editor/api/upload-editor-attachment-file';
import { resolveStorageWriteSupabaseClient } from '@/shared/lib/supabase/storage-client';

vi.mock('@/shared/lib/supabase/storage-client', () => ({
  resolveStorageWriteSupabaseClient: vi.fn(),
}));

describe('uploadEditorAttachmentFile', () => {
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

    vi.mocked(resolveStorageWriteSupabaseClient).mockResolvedValue({
      storage: {
        from,
      },
    } as never);
  });

  it("Under contentType 'article', uploadEditorAttachmentFile must upload the file to the content bucket's attachments path", async () => {
    const file = new File(['binary'], 'resume.pdf', { type: 'application/pdf' });

    await uploadEditorAttachmentFile({
      contentType: 'article',
      file,
    });

    expect(from).toHaveBeenCalledWith('article');
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^attachments\//),
      file,
      expect.objectContaining({
        contentType: 'application/pdf',
        upsert: false,
      }),
    );
  });

  it("Under contentType 'resume', uploadEditorAttachmentFile must upload the file to the resume bucket's attachments path", async () => {
    const file = new File(['binary'], 'resume.pdf', { type: 'application/pdf' });

    await uploadEditorAttachmentFile({
      contentType: 'resume',
      file,
    });

    expect(from).toHaveBeenCalledWith('resume');
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^attachments\//),
      file,
      expect.objectContaining({
        contentType: 'application/pdf',
        upsert: false,
      }),
    );
  });

  it('storage 업로드가 실패하면 uploadEditorAttachmentFile은 원인 메시지를 포함한 예외를 던져야 한다', async () => {
    upload.mockResolvedValue({
      error: {
        message: 'Storage quota exceeded',
      },
    });

    await expect(
      uploadEditorAttachmentFile({
        contentType: 'article',
        file: new File(['binary'], 'large-file.pdf', { type: 'application/pdf' }),
      }),
    ).rejects.toThrow('[attachment-upload] 파일 업로드 실패: Storage quota exceeded');
  });
});
