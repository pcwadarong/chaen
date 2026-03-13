import { createDefaultPdfFileContent } from '@/entities/pdf-file/model/config';
import type { PdfFileContent } from '@/entities/pdf-file/model/types';
import { EDITOR_LOCALES, type Locale } from '@/widgets/editor/model/editor-core.types';

import type {
  ResumeEditorContent,
  ResumeEditorContentMap,
  ResumePublishSettings,
  ResumePublishValidationErrors,
} from './resume-editor.types';

const EMPTY_RESUME_EDITOR_ERROR: ResumePublishValidationErrors = {};

/**
 * PDF 콘텐츠 row에서 편집에 필요한 텍스트 필드만 추립니다.
 */
export const toResumeEditorContent = (
  content: Pick<
    PdfFileContent,
    'body' | 'description' | 'download_button_label' | 'download_unavailable_label' | 'title'
  >,
): ResumeEditorContent => ({
  body: content.body ?? '',
  description: content.description ?? '',
  download_button_label: content.download_button_label ?? '',
  download_unavailable_label: content.download_unavailable_label ?? '',
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
      download_unavailable_label: content?.download_unavailable_label ?? '',
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
      leftContent.download_button_label === rightContent.download_button_label &&
      leftContent.download_unavailable_label === rightContent.download_unavailable_label
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
 * resume 게시 직전 최소 입력과 PDF 준비 여부를 검증합니다.
 */
export const validateResumePublishState = ({
  contents,
  settings,
}: {
  contents: ResumeEditorContentMap;
  settings: ResumePublishSettings;
}): ResumePublishValidationErrors => {
  const koContent = contents.ko;
  const errors: ResumePublishValidationErrors = {};

  if (!koContent.title.trim()) {
    errors.koTitle = '한국어 제목을 입력해주세요';
  }

  if (!koContent.body.trim()) {
    errors.koBody = '한국어 본문을 입력해주세요';
  }

  if (!settings.isPdfReady) {
    errors.pdf = '이력서 PDF를 업로드해주세요';
  }

  return Object.keys(errors).length === 0 ? EMPTY_RESUME_EDITOR_ERROR : errors;
};
