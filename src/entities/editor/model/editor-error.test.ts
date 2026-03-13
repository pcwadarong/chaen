import {
  createEditorError,
  EDITOR_ERROR_MESSAGE,
  parseEditorError,
  resolveEditorPublishInlineErrorField,
} from './editor-error';

describe('editor-error', () => {
  it('publish panel 인라인 에러 필드를 코드 기준으로 매핑한다', () => {
    expect(resolveEditorPublishInlineErrorField('missingKoTitle')).toBe('koTitle');
    expect(resolveEditorPublishInlineErrorField('missingSlug')).toBe('slug');
    expect(resolveEditorPublishInlineErrorField('scheduledPublishMustBeFuture')).toBe('publishAt');
    expect(resolveEditorPublishInlineErrorField('duplicateSlug')).toBe('slug');
  });

  it('toast 전용 에러는 인라인 필드로 매핑하지 않는다', () => {
    expect(resolveEditorPublishInlineErrorField('publishFailed')).toBeNull();
    expect(resolveEditorPublishInlineErrorField('thumbnailUploadFailedWithRetry')).toBeNull();
  });

  it('editor 에러를 code와 message로 직렬화하고 다시 복원한다', () => {
    const payload = parseEditorError(createEditorError('duplicateSlug'), 'publishFailed');

    expect(payload).toEqual({
      code: 'duplicateSlug',
      message: EDITOR_ERROR_MESSAGE.duplicateSlug,
    });
  });
});
