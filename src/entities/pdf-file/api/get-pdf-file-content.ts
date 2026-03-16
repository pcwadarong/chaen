import { getPdfFileContentConfig } from '@/entities/pdf-file/model/config';
import type { PdfFileContent, PdfFileKind } from '@/entities/pdf-file/model/types';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';
import { resolveLocaleAwareData } from '@/shared/lib/supabase/resolve-locale-aware-data';

import 'server-only';

/**
 * PDF 소개 콘텐츠 조회 옵션입니다.
 */
type GetPdfFileContentOptions = {
  locale: string;
  kind?: PdfFileKind;
  fallbackLocale?: string;
};

/**
 * 종류(`resume`, `portfolio`)에 맞는 Supabase 콘텐츠 테이블에서 locale별 소개 텍스트를 조회합니다.
 * locale 데이터가 없으면 fallback locale(`ko`)을 한 번 더 조회합니다.
 */
export const getPdfFileContent = async ({
  locale,
  kind = 'resume',
  fallbackLocale = 'ko',
}: GetPdfFileContentOptions): Promise<PdfFileContent | null> => {
  const normalizedLocale = locale.toLowerCase().split('-')[0] ?? 'en';
  const normalizedFallbackLocale = fallbackLocale.toLowerCase().split('-')[0] ?? 'ko';
  const { tableName } = getPdfFileContentConfig(kind);
  const supabase = createOptionalPublicServerSupabaseClient();

  if (!supabase) return null;

  return resolveLocaleAwareData<PdfFileContent | null>({
    emptyData: null,
    fallbackLocale: normalizedFallbackLocale,
    fetchByLocale: async targetLocale => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('locale', targetLocale)
        .maybeSingle<PdfFileContent>();

      if (error) {
        return {
          data: null,
          localeColumnMissing: false,
        };
      }

      return {
        data,
        localeColumnMissing: false,
      };
    },
    fetchLegacy: async () => null,
    isEmptyData: item => item === null,
    targetLocale: normalizedLocale,
  });
};
