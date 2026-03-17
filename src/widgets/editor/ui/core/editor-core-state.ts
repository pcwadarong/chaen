import type { ToastItem } from '@/shared/ui/toast/toast';
import {
  type DraftSaveResult,
  EDITOR_LOCALES,
  type EditorState,
  type Locale,
} from '@/widgets/editor/ui/core/editor-core.types';
import { createEmptyTranslations } from '@/widgets/editor/ui/core/editor-core.utils';

/**
 * 편집 상태를 callback 계약에 맞는 snapshot으로 구성합니다.
 */
export const buildEditorStateSnapshot = ({
  dirty,
  slug,
  tags,
  translations,
}: Pick<EditorState, 'dirty' | 'slug' | 'tags' | 'translations'>): EditorState => ({
  dirty,
  slug,
  tags,
  translations: EDITOR_LOCALES.reduce<Record<Locale, EditorState['translations'][Locale]>>(
    (accumulator, locale) => {
      accumulator[locale] = {
        content: translations[locale]?.content ?? '',
        description: translations[locale]?.description ?? '',
        title: translations[locale]?.title ?? '',
      };

      return accumulator;
    },
    createEmptyTranslations(),
  ),
});

/**
 * 저장 실패/검증 실패 토스트를 구성합니다.
 */
export const createSaveErrorToast = (message: string): ToastItem => ({
  id: `save-error-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  message,
  tone: 'error',
});

/**
 * 저장 완료 시각으로 사용할 현재 시각 문자열을 생성합니다.
 */
const createTimestamp = () => new Date().toISOString();

/**
 * draft 저장 callback의 반환값에서 마지막 저장 시각을 추출합니다.
 */
export const resolveSavedAt = (result: DraftSaveResult | void) =>
  result?.savedAt ?? createTimestamp();
