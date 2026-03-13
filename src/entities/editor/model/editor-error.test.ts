import { EDITOR_ERROR_MESSAGE, resolveEditorPublishInlineErrorField } from './editor-error';

describe('editor-error', () => {
  it('publish panel 인라인 에러 필드를 메시지 기준으로 매핑한다', () => {
    expect(resolveEditorPublishInlineErrorField(EDITOR_ERROR_MESSAGE.missingKoTitle)).toBe(
      'koTitle',
    );
    expect(resolveEditorPublishInlineErrorField(EDITOR_ERROR_MESSAGE.missingSlug)).toBe('slug');
    expect(
      resolveEditorPublishInlineErrorField(EDITOR_ERROR_MESSAGE.scheduledPublishMustBeFuture),
    ).toBe('publishAt');
    expect(resolveEditorPublishInlineErrorField(EDITOR_ERROR_MESSAGE.duplicateSlug)).toBe('slug');
  });

  it('toast 전용 에러는 인라인 필드로 매핑하지 않는다', () => {
    expect(resolveEditorPublishInlineErrorField(EDITOR_ERROR_MESSAGE.publishFailed)).toBeNull();
    expect(
      resolveEditorPublishInlineErrorField(EDITOR_ERROR_MESSAGE.thumbnailUploadFailedWithRetry),
    ).toBeNull();
  });
});
