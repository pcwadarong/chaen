import {
  createDefaultPdfFileContent,
  getPdfFileContentConfig,
} from '@/entities/pdf-file/model/config';
import type { PdfFileContent } from '@/entities/pdf-file/model/types';
import { createServerSupabaseClient } from '@/shared/lib/supabase/server';
import type { Locale } from '@/widgets/editor/model/editor-core.types';

import 'server-only';

export type ResumeEditorContentMap = Record<Locale, PdfFileContent>;

const RESUME_EDITOR_LOCALES = ['ko', 'en', 'ja', 'fr'] as const satisfies readonly Locale[];

/**
 * resume 편집 화면에서 사용할 locale별 콘텐츠 레코드를 반환합니다.
 */
export const getResumeEditorContentMap = async (): Promise<ResumeEditorContentMap> => {
  const supabase = await createServerSupabaseClient();
  const { tableName } = getPdfFileContentConfig('resume');
  const { data, error } = await supabase.from(tableName).select('*');

  if (error) {
    throw new Error(`[resume-editor] 콘텐츠 조회 실패: ${error.message}`);
  }

  const contentMap = RESUME_EDITOR_LOCALES.reduce<ResumeEditorContentMap>((accumulator, locale) => {
    accumulator[locale] = createDefaultPdfFileContent(locale);
    return accumulator;
  }, {} as ResumeEditorContentMap);

  ((data ?? []) as PdfFileContent[]).forEach(row => {
    const normalizedLocale = row.locale.toLowerCase();

    if (!isResumeLocale(normalizedLocale)) {
      return;
    }

    contentMap[normalizedLocale] = row;
  });

  return contentMap;
};

/**
 * resume 편집 화면이 다루는 locale인지 판별합니다.
 */
const isResumeLocale = (locale: string): locale is Locale =>
  locale === 'ko' || locale === 'en' || locale === 'ja' || locale === 'fr';
