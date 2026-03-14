const EDITOR_ERROR_PREFIX = '__EDITOR_ERROR__';

export const EDITOR_ERROR_MESSAGE = {
  draftDeleteFailed: '임시저장을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.',
  duplicateSlug: '이미 사용 중인 슬러그입니다. 다른 슬러그를 사용해주세요.',
  draftSaveFailed: '임시 저장에 실패했습니다. 잠시 후 다시 시도해주세요.',
  draftSaveInvalidState: '임시 저장 요청을 확인해주세요.',
  draftSaveInvalidSettings: '임시 저장 설정을 확인해주세요.',
  serviceRoleUnavailable: '관리자 저장 권한이 연결되지 않았습니다. 환경 변수를 확인해주세요.',
  missingCompleteTranslation: '제목과 본문이 모두 있는 언어 버전이 최소 하나는 필요합니다.',
  missingKoTitle: '한국어 제목을 입력해주세요',
  missingSlug: '슬러그를 입력해주세요',
  publishFailed: '발행 처리에 실패했습니다. 잠시 후 다시 시도해주세요.',
  publishInvalidSettings: '발행 설정을 확인해주세요.',
  publishInvalidState: '발행할 편집 상태를 확인해주세요.',
  scheduledPublishMustBeFuture: '발행 시간은 현재 시간 이후여야 합니다',
  slugCheckFailed: '중복 확인에 실패했습니다.',
  slugFormatInvalid: '슬러그는 영문 소문자, 숫자, 하이픈만 사용 가능합니다',
  thumbnailUploadFailed: '썸네일 업로드에 실패했습니다',
  thumbnailUploadFailedWithRetry: '썸네일 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.',
} as const;

export type EditorErrorCode = keyof typeof EDITOR_ERROR_MESSAGE;
export type EditorPublishInlineErrorField = 'koTitle' | 'publishAt' | 'slug';

const EDITOR_PUBLISH_INLINE_ERROR_FIELD_BY_CODE: Record<
  EditorErrorCode,
  EditorPublishInlineErrorField | null
> = {
  draftDeleteFailed: null,
  duplicateSlug: 'slug',
  draftSaveFailed: null,
  draftSaveInvalidSettings: null,
  draftSaveInvalidState: null,
  serviceRoleUnavailable: null,
  missingCompleteTranslation: null,
  missingKoTitle: 'koTitle',
  missingSlug: 'slug',
  publishFailed: null,
  publishInvalidSettings: null,
  publishInvalidState: null,
  scheduledPublishMustBeFuture: 'publishAt',
  slugCheckFailed: null,
  slugFormatInvalid: 'slug',
  thumbnailUploadFailed: null,
  thumbnailUploadFailedWithRetry: null,
};

/**
 * editor 도메인 에러 코드를 사용자 노출 메시지로 변환합니다.
 */
export const resolveEditorErrorMessage = (code: EditorErrorCode) => EDITOR_ERROR_MESSAGE[code];

/**
 * server action과 client 사이에서 안전하게 전달할 수 있는 editor 에러를 만듭니다.
 */
export const createEditorError = (
  code: EditorErrorCode,
  message: string = resolveEditorErrorMessage(code),
) => new Error(`${EDITOR_ERROR_PREFIX}:${code}:${message}`);

/**
 * 외부에서 받은 에러를 editor 에러 코드와 사용자 메시지로 정규화합니다.
 */
export const parseEditorError = (
  error: unknown,
  fallbackCode: EditorErrorCode,
): {
  code: EditorErrorCode;
  message: string;
} => {
  if (error instanceof Error && error.message.startsWith(`${EDITOR_ERROR_PREFIX}:`)) {
    const [, code, ...messageParts] = error.message.split(':');
    const normalizedCode = code as EditorErrorCode;

    return {
      code: normalizedCode,
      message: messageParts.join(':') || resolveEditorErrorMessage(normalizedCode),
    };
  }

  if (error instanceof Error && error.message) {
    return {
      code: fallbackCode,
      message: resolveEditorErrorMessage(fallbackCode),
    };
  }

  return {
    code: fallbackCode,
    message: resolveEditorErrorMessage(fallbackCode),
  };
};

/**
 * publish panel에서 editor 에러 코드를 어떤 인라인 필드에 매핑할지 계산합니다.
 */
export const resolveEditorPublishInlineErrorField = (
  code: EditorErrorCode,
): EditorPublishInlineErrorField | null => EDITOR_PUBLISH_INLINE_ERROR_FIELD_BY_CODE[code] ?? null;
