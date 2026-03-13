export const EDITOR_ERROR_MESSAGE = {
  duplicateSlug: '이미 사용 중인 슬러그입니다. 다른 슬러그를 사용해주세요.',
  draftSaveFailed: '임시 저장에 실패했습니다. 잠시 후 다시 시도해주세요.',
  draftSaveInvalidState: '임시 저장 요청을 확인해주세요.',
  draftSaveInvalidSettings: '임시 저장 설정을 확인해주세요.',
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

export type EditorPublishInlineErrorField = 'koTitle' | 'publishAt' | 'slug';

const EDITOR_PUBLISH_INLINE_ERROR_FIELD_BY_MESSAGE: Record<
  (typeof EDITOR_ERROR_MESSAGE)[keyof typeof EDITOR_ERROR_MESSAGE],
  EditorPublishInlineErrorField | null
> = {
  [EDITOR_ERROR_MESSAGE.duplicateSlug]: 'slug',
  [EDITOR_ERROR_MESSAGE.draftSaveFailed]: null,
  [EDITOR_ERROR_MESSAGE.draftSaveInvalidSettings]: null,
  [EDITOR_ERROR_MESSAGE.draftSaveInvalidState]: null,
  [EDITOR_ERROR_MESSAGE.missingCompleteTranslation]: null,
  [EDITOR_ERROR_MESSAGE.missingKoTitle]: 'koTitle',
  [EDITOR_ERROR_MESSAGE.missingSlug]: 'slug',
  [EDITOR_ERROR_MESSAGE.publishFailed]: null,
  [EDITOR_ERROR_MESSAGE.publishInvalidSettings]: null,
  [EDITOR_ERROR_MESSAGE.publishInvalidState]: null,
  [EDITOR_ERROR_MESSAGE.scheduledPublishMustBeFuture]: 'publishAt',
  [EDITOR_ERROR_MESSAGE.slugCheckFailed]: null,
  [EDITOR_ERROR_MESSAGE.slugFormatInvalid]: 'slug',
  [EDITOR_ERROR_MESSAGE.thumbnailUploadFailed]: null,
  [EDITOR_ERROR_MESSAGE.thumbnailUploadFailedWithRetry]: null,
};

/**
 * publish panel에서 서버/검증 에러를 어떤 인라인 필드에 매핑할지 계산합니다.
 */
export const resolveEditorPublishInlineErrorField = (
  message: string,
): EditorPublishInlineErrorField | null =>
  EDITOR_PUBLISH_INLINE_ERROR_FIELD_BY_MESSAGE[
    message as keyof typeof EDITOR_PUBLISH_INLINE_ERROR_FIELD_BY_MESSAGE
  ] ?? null;
