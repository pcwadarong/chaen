import { EDITOR_LOCALES, type Locale } from '@/entities/editor/model/editor-types';
import { createDefaultPdfFileContent } from '@/entities/pdf-file/model/config';
import type { PdfFileContent } from '@/entities/pdf-file/model/types';
import type {
  ResumeDraftSeed,
  ResumeEditorContent,
  ResumeEditorContentMap,
  ResumeEditorSeed,
  ResumePublishValidationErrors,
} from '@/entities/resume/model/resume-editor.types';
import { RESUME_EDITOR_ERROR_MESSAGE } from '@/entities/resume/model/resume-editor-error';

const EMPTY_RESUME_EDITOR_ERROR: ResumePublishValidationErrors = {};

/**
 * PDF 콘텐츠 row에서 편집에 필요한 텍스트 필드만 추립니다.
 */
export const toResumeEditorContent = (
  content: Pick<PdfFileContent, 'body' | 'description' | 'download_button_label' | 'title'>,
): ResumeEditorContent => ({
  body: content.body ?? '',
  description: content.description ?? '',
  download_button_label: content.download_button_label ?? '',
  title: content.title ?? '',
});

/**
 * locale 순서를 고정한 resume 편집 기본값을 생성합니다.
 */
export const createDefaultResumeEditorContentMap = (): ResumeEditorContentMap =>
  EDITOR_LOCALES.reduce<ResumeEditorContentMap>((accumulator, locale: Locale) => {
    accumulator[locale] = toResumeEditorContent(createDefaultPdfFileContent(locale));
    return accumulator;
  }, {} as ResumeEditorContentMap);

/**
 * resume 편집 상태 비교 전에 locale별 필드를 일관된 형태로 정규화합니다.
 */
export const normalizeResumeEditorContentMap = (
  contents: Partial<Record<Locale, Partial<ResumeEditorContent>>>,
): ResumeEditorContentMap =>
  EDITOR_LOCALES.reduce<ResumeEditorContentMap>((accumulator, locale: Locale) => {
    const content = contents[locale];

    accumulator[locale] = {
      body: content?.body ?? '',
      description: content?.description ?? '',
      download_button_label: content?.download_button_label ?? '',
      title: content?.title ?? '',
    };

    return accumulator;
  }, createDefaultResumeEditorContentMap());

/**
 * 두 resume 편집 내용이 실제로 같은지 판별합니다.
 */
export const isResumeEditorContentMapEqual = (
  left: ResumeEditorContentMap,
  right: ResumeEditorContentMap,
) =>
  EDITOR_LOCALES.every((locale: Locale) => {
    const leftContent = left[locale];
    const rightContent = right[locale];

    return (
      leftContent.title === rightContent.title &&
      leftContent.description === rightContent.description &&
      leftContent.body === rightContent.body &&
      leftContent.download_button_label === rightContent.download_button_label
    );
  });

/**
 * resume 편집 seed에서 footer 저장 시각으로 쓸 최신 updated_at을 계산합니다.
 */
export const getResumeEditorSavedAt = (
  rows: Array<Pick<PdfFileContent, 'updated_at'>>,
): string | null => {
  const latestTime = rows.reduce<number | null>((accumulator, row) => {
    const nextTime = new Date(row.updated_at).getTime();

    if (Number.isNaN(nextTime) || row.updated_at === '1970-01-01T00:00:00.000Z') {
      return accumulator;
    }

    if (accumulator === null) {
      return nextTime;
    }

    return Math.max(accumulator, nextTime);
  }, null);

  if (latestTime === null) {
    return null;
  }

  return new Date(latestTime).toISOString();
};

/**
 * resume 게시 직전 최소 입력값을 검증합니다.
 */
export const validateResumePublishState = ({
  contents,
}: {
  contents: ResumeEditorContentMap;
}): ResumePublishValidationErrors => {
  const koContent = contents.ko;
  const errors: ResumePublishValidationErrors = {};

  if (!koContent.title.trim()) {
    errors.koTitle = RESUME_EDITOR_ERROR_MESSAGE.missingKoTitle;
  }

  if (!koContent.body.trim()) {
    errors.koBody = RESUME_EDITOR_ERROR_MESSAGE.missingKoBody;
  }

  return Object.keys(errors).length === 0 ? EMPTY_RESUME_EDITOR_ERROR : errors;
};

/**
 * resume_drafts.contents jsonb에 저장할 locale별 resume 필드 레코드를 생성합니다.
 */
export const buildResumeDraftContentRecord = (contents: ResumeEditorContentMap) =>
  Object.fromEntries(
    EDITOR_LOCALES.map(locale => [
      locale,
      {
        body: contents[locale].body,
        description: contents[locale].description,
        download_button_label: contents[locale].download_button_label,
        title: contents[locale].title,
      },
    ]),
  ) as Record<Locale, ResumeEditorContent>;

/**
 * 기존 resume seed 위에 draft 내용을 덮어써 이어쓰기 초기값을 구성합니다.
 */
export const mergeResumeEditorSeedWithDraft = (
  seed: ResumeEditorSeed,
  draftSeed: ResumeDraftSeed,
): ResumeEditorSeed => ({
  ...seed,
  initialContents: draftSeed.contents,
  initialDraftId: draftSeed.draftId,
  initialSavedAt: draftSeed.updatedAt,
});
