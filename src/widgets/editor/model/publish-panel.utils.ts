import type {
  EditorState,
  PublishSettings,
  PublishVisibility,
} from '@/widgets/editor/model/editor-core.types';

export type PublishPanelFormValues = {
  allowComments: boolean;
  dateInput: string;
  publishMode: 'immediate' | 'scheduled';
  slug: string;
  thumbnailUrl: string;
  timeInput: string;
  visibility: PublishVisibility;
};

export type PublishPanelValidationErrors = {
  koTitle?: string;
  publishAt?: string;
  slug?: string;
};

/**
 * 예약 발행용 로컬 날짜/시간 입력을 UTC ISO 문자열로 변환합니다.
 */
export const toScheduledPublishUtcIso = (dateInput: string, timeInput: string) => {
  if (!dateInput || !timeInput) return null;

  const localDate = new Date(`${dateInput}T${timeInput}`);

  if (Number.isNaN(localDate.getTime())) return null;

  return localDate.toISOString();
};

/**
 * 패널 form 값을 최종 발행 설정 payload로 정리합니다.
 */
export const buildPublishSettings = (formValues: PublishPanelFormValues): PublishSettings => ({
  allowComments: formValues.allowComments,
  publishAt:
    formValues.publishMode === 'scheduled'
      ? toScheduledPublishUtcIso(formValues.dateInput, formValues.timeInput)
      : null,
  slug: formValues.slug.trim(),
  thumbnailUrl: formValues.thumbnailUrl.trim(),
  visibility: formValues.visibility,
});

/**
 * 발행 직전 필수값과 예약 발행 시각을 검증합니다.
 */
export const validatePublishSettings = ({
  editorState,
  now = new Date(),
  settings,
}: {
  editorState: EditorState;
  now?: Date;
  settings: PublishSettings;
}): PublishPanelValidationErrors => {
  const errors: PublishPanelValidationErrors = {};

  if (!editorState.translations.ko.title.trim()) {
    errors.koTitle = '한국어 제목을 입력해주세요';
  }

  if (!settings.slug) {
    errors.slug = '슬러그를 입력해주세요';
  } else if (!/^[a-z0-9-]+$/.test(settings.slug)) {
    errors.slug = '슬러그는 영문 소문자, 숫자, 하이픈만 사용 가능합니다';
  }

  if (settings.publishAt) {
    const scheduledDate = new Date(settings.publishAt);

    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= now.getTime()) {
      errors.publishAt = '발행 시간은 현재 시간 이후여야 합니다';
    }
  }

  return errors;
};
