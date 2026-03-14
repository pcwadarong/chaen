import {
  createResumeEditorError,
  parseResumeEditorError,
  resolveResumePublishInlineErrorField,
  RESUME_EDITOR_ERROR_MESSAGE,
} from './resume-editor-error';

describe('resume-editor-error', () => {
  it('resume publish panel 인라인 에러 필드를 코드 기준으로 매핑한다', () => {
    expect(resolveResumePublishInlineErrorField('missingKoTitle')).toBe('koTitle');
    expect(resolveResumePublishInlineErrorField('missingKoBody')).toBe('koBody');
    expect(resolveResumePublishInlineErrorField('missingPdf')).toBe('pdf');
    expect(resolveResumePublishInlineErrorField('pdfUploadFailed')).toBe('pdf');
  });

  it('toast 전용 에러는 인라인 필드로 매핑하지 않는다', () => {
    expect(resolveResumePublishInlineErrorField('publishFailed')).toBeNull();
    expect(resolveResumePublishInlineErrorField('draftSaveFailed')).toBeNull();
  });

  it('resume editor 에러를 code와 message로 직렬화하고 다시 복원한다', () => {
    const payload = parseResumeEditorError(createResumeEditorError('missingPdf'), 'publishFailed');

    expect(payload).toEqual({
      code: 'missingPdf',
      message: RESUME_EDITOR_ERROR_MESSAGE.missingPdf,
    });
  });

  it('일반 에러는 fallback code의 사용자 메시지로 정규화한다', () => {
    const payload = parseResumeEditorError(new Error('save failed'), 'draftSaveFailed');

    expect(payload).toEqual({
      code: 'draftSaveFailed',
      message: RESUME_EDITOR_ERROR_MESSAGE.draftSaveFailed,
    });
  });
});
