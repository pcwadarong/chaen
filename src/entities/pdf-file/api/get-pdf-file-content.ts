import { unstable_cacheTag as cacheTag } from 'next/cache';

import {
  createPdfFileContentCacheTag,
  PDF_FILE_CONTENT_CACHE_TAG,
  PDF_FILES_CACHE_TAG,
} from '@/entities/pdf-file/model/cache-tags';
import { getPdfFileContentConfig } from '@/entities/pdf-file/model/config';
import type { PdfFileContent, PdfFileKind } from '@/entities/pdf-file/model/types';
import { buildContentLocaleFallbackChain } from '@/shared/lib/i18n/content-locale-fallback';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

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
 * 종류(`resume`, `portfolio`)에 맞는 Supabase 콘텐츠 테이블에서 locale fallback 체인 순서대로 소개 텍스트를 조회합니다.
 */
const readCachedPdfFileContent = async ({
  kind,
  locale,
}: Omit<Required<GetPdfFileContentOptions>, 'fallbackLocale'>): Promise<PdfFileContent | null> => {
  'use cache';

  cacheTag(PDF_FILES_CACHE_TAG, PDF_FILE_CONTENT_CACHE_TAG, createPdfFileContentCacheTag(kind));

  const { tableName } = getPdfFileContentConfig(kind);
  const supabase = createOptionalPublicServerSupabaseClient();

  if (!supabase) return null;

  const localeFallbackChain = buildContentLocaleFallbackChain(locale);

  for (const targetLocale of localeFallbackChain) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('locale', targetLocale)
      .maybeSingle<PdfFileContent>();

    if (error) {
      return null;
    }

    if (data) {
      return data;
    }
  }

  return null;
};

/**
 * 종류(`resume`, `portfolio`)에 맞는 Supabase 콘텐츠 테이블에서 locale별 소개 텍스트를 조회합니다.
 * locale 데이터가 없으면 fallback locale(`ko`)을 한 번 더 조회합니다.
 */
export const getPdfFileContent = async ({
  locale,
  kind = 'resume',
  fallbackLocale: _fallbackLocale = 'ko',
}: GetPdfFileContentOptions): Promise<PdfFileContent | null> => {
  const normalizedLocale = locale.toLowerCase().split('-')[0] ?? 'en';

  return readCachedPdfFileContent({
    kind,
    locale: normalizedLocale,
  });
};
