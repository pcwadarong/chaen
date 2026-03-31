// @vitest-environment node

import { uploadEditorFile } from '@/entities/editor/api/upload-editor-file';

describe('uploadEditorFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('응답 본문이 JSON이 아니어도 일관된 에러 메시지로 실패한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: vi.fn().mockRejectedValue(new Error('invalid json')),
        ok: false,
        statusText: 'Internal Server Error',
      }),
    );

    await expect(
      uploadEditorFile({
        contentType: 'article',
        file: new File(['pdf'], 'resume.pdf', { type: 'application/pdf' }),
      }),
    ).rejects.toThrow('Attachment upload failed');
  });
});
