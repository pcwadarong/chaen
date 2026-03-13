const RESUME_EDITOR_ERROR_PREFIX = '__RESUME_EDITOR_ERROR__';

export const RESUME_EDITOR_ERROR_MESSAGE = {
  draftDeleteFailed: '이력서 임시저장을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.',
  draftSaveFailed: '이력서 임시 저장에 실패했습니다. 잠시 후 다시 시도해주세요.',
  draftSaveInvalidState: '이력서 임시 저장 요청을 확인해주세요.',
  missingKoBody: '한국어 본문을 입력해주세요',
  missingKoTitle: '한국어 제목을 입력해주세요',
  missingPdf: '이력서 PDF를 업로드해주세요',
  pdfUploadFailed: '이력서 PDF 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.',
  pdfUploadNotConfigured: '이력서 PDF 업로드 처리기가 연결되지 않았습니다.',
  publishFailed: '이력서 게시 처리에 실패했습니다. 잠시 후 다시 시도해주세요.',
  publishInvalidSettings: '이력서 게시 설정을 확인해주세요.',
  publishInvalidState: '이력서 편집 상태를 확인해주세요.',
} as const;

export type ResumeEditorErrorCode = keyof typeof RESUME_EDITOR_ERROR_MESSAGE;
export type ResumePublishInlineErrorField = 'koBody' | 'koTitle' | 'pdf';

const RESUME_EDITOR_INLINE_ERROR_FIELD_BY_CODE: Record<
  ResumeEditorErrorCode,
  ResumePublishInlineErrorField | null
> = {
  draftDeleteFailed: null,
  draftSaveFailed: null,
  draftSaveInvalidState: null,
  missingKoBody: 'koBody',
  missingKoTitle: 'koTitle',
  missingPdf: 'pdf',
  pdfUploadFailed: 'pdf',
  pdfUploadNotConfigured: null,
  publishFailed: null,
  publishInvalidSettings: null,
  publishInvalidState: null,
};

/**
 * resume editor 도메인 에러 코드를 사용자 노출 메시지로 변환합니다.
 */
export const resolveResumeEditorErrorMessage = (code: ResumeEditorErrorCode) =>
  RESUME_EDITOR_ERROR_MESSAGE[code];

/**
 * server action과 client 사이에서 안전하게 전달할 수 있는 resume editor 에러를 만듭니다.
 */
export const createResumeEditorError = (
  code: ResumeEditorErrorCode,
  message: string = resolveResumeEditorErrorMessage(code),
) => new Error(`${RESUME_EDITOR_ERROR_PREFIX}:${code}:${message}`);

/**
 * 외부에서 받은 에러를 resume editor 에러 코드와 사용자 메시지로 정규화합니다.
 */
export const parseResumeEditorError = (
  error: unknown,
  fallbackCode: ResumeEditorErrorCode,
): {
  code: ResumeEditorErrorCode;
  message: string;
} => {
  if (error instanceof Error && error.message.startsWith(`${RESUME_EDITOR_ERROR_PREFIX}:`)) {
    const [, code, ...messageParts] = error.message.split(':');
    const normalizedCode = code as ResumeEditorErrorCode;

    return {
      code: normalizedCode,
      message: messageParts.join(':') || resolveResumeEditorErrorMessage(normalizedCode),
    };
  }

  if (error instanceof Error && error.message) {
    return {
      code: fallbackCode,
      message: error.message,
    };
  }

  return {
    code: fallbackCode,
    message: resolveResumeEditorErrorMessage(fallbackCode),
  };
};

/**
 * resume 게시 패널에서 어떤 인라인 필드에 매핑할지 계산합니다.
 */
export const resolveResumePublishInlineErrorField = (
  code: ResumeEditorErrorCode,
): ResumePublishInlineErrorField | null => RESUME_EDITOR_INLINE_ERROR_FIELD_BY_CODE[code] ?? null;
