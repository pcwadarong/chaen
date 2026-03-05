import { createOptionalPublicServerSupabaseClient } from '@/lib/supabase/public-server';

import 'server-only';

import { getPdfFileContentConfig } from '../model/config';
import type { PdfFileContent, PdfFileKind } from '../model/types';

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

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('locale', normalizedLocale)
    .maybeSingle<PdfFileContent>();

  if (error) return null;
  if (data) return data;

  if (normalizedLocale !== normalizedFallbackLocale) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from(tableName)
      .select('*')
      .eq('locale', normalizedFallbackLocale)
      .maybeSingle<PdfFileContent>();

    if (fallbackError) return null;
    if (fallbackData) return fallbackData;
  }

  return null;
};
