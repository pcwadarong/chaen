import { EDITOR_ERROR_MESSAGE } from '@/entities/editor/model/editor-error';
import { normalizeSlugInput } from '@/shared/lib/editor/slug';
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
 * editor draft 저장과 publish panel 초기화에서 공통으로 쓰는 발행 설정 기본값을 만듭니다.
 */
export const createDefaultPublishSettings = ({
  initialSettings,
  slug,
}: {
  initialSettings?: PublishSettings;
  slug: string;
}): PublishSettings => ({
  allowComments: initialSettings?.allowComments ?? true,
  publishAt: initialSettings?.publishAt ?? null,
  slug: initialSettings?.slug ?? slug,
  thumbnailUrl: initialSettings?.thumbnailUrl ?? '',
  visibility: initialSettings?.visibility ?? 'public',
});

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
  verifiedSlug = null,
  settings,
}: {
  editorState: EditorState;
  now?: Date;
  verifiedSlug?: string | null;
  settings: PublishSettings;
}): PublishPanelValidationErrors => {
  const errors: PublishPanelValidationErrors = {};
  const normalizedSlug = normalizeSlugInput(settings.slug);

  if (!editorState.translations.ko.title.trim()) {
    errors.koTitle = EDITOR_ERROR_MESSAGE.missingKoTitle;
  }

  if (!settings.slug.trim()) {
    errors.slug = EDITOR_ERROR_MESSAGE.missingSlug;
  } else if (!normalizedSlug) {
    errors.slug = EDITOR_ERROR_MESSAGE.slugFormatInvalid;
  } else if (verifiedSlug !== normalizedSlug) {
    errors.slug = EDITOR_ERROR_MESSAGE.slugVerificationRequired;
  }

  if (settings.publishAt) {
    const scheduledDate = new Date(settings.publishAt);

    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= now.getTime()) {
      errors.publishAt = EDITOR_ERROR_MESSAGE.scheduledPublishMustBeFuture;
    }
  }

  return errors;
};
