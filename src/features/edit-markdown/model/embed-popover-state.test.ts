// @vitest-environment node

import { EDITOR_ERROR_MESSAGE } from '@/entities/editor/model/editor-error';
import {
  normalizeEmbedInput,
  uploadImageEmbedSource,
} from '@/features/edit-markdown/model/embed-popover-state';

describe('embed-popover-state', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('입력값은 trim하고 비어 있으면 null을 반환한다', () => {
    expect(normalizeEmbedInput('  https://openai.com  ')).toBe('https://openai.com');
    expect(normalizeEmbedInput('   ')).toBeNull();
  });

  it('이미지 업로드가 성공하면 URL을 반환한다', async () => {
    const uploadEditorImage = vi.fn().mockResolvedValue('https://example.com/uploaded.webp');
    const file = new File(['binary'], 'inline.png', { type: 'image/png' });

    await expect(
      uploadImageEmbedSource({
        contentType: 'article',
        file,
        uploadEditorImage,
      }),
    ).resolves.toEqual({
      errorMessage: null,
      url: 'https://example.com/uploaded.webp',
    });

    expect(uploadEditorImage).toHaveBeenCalledWith({
      contentType: 'article',
      file,
      imageKind: 'content',
    });
  });

  it('이미지 업로드가 실패하면 사용자용 에러 메시지를 반환한다', async () => {
    const uploadEditorImage = vi.fn().mockRejectedValue(new Error('upload failed'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const file = new File(['binary'], 'inline.png', { type: 'image/png' });

    await expect(
      uploadImageEmbedSource({
        contentType: 'article',
        file,
        uploadEditorImage,
      }),
    ).resolves.toEqual({
      errorMessage: EDITOR_ERROR_MESSAGE.imageUploadFailedWithRetry,
      url: null,
    });

    expect(uploadEditorImage).toHaveBeenCalledWith({
      contentType: 'article',
      file,
      imageKind: 'content',
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'uploadImageEmbedSource failed',
      expect.objectContaining({
        contentType: 'article',
        error: expect.any(Error),
        imageKind: 'content',
      }),
    );
  });
});
