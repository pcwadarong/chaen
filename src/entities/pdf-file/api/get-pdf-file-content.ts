import { createPublicServerSupabaseClient } from '@/lib/supabase/public-server';

import 'server-only';

import type { PdfFileContent } from '../model/types';

/**
 * Supabase `resume_contents` 테이블에서 locale별 PDF 소개 텍스트를 조회합니다.
 * 관리자 수정은 Supabase Dashboard(Table Editor)에서 가능하도록 단순 구조로 유지합니다.
 */
export const getPdfFileContent = async (locale: string): Promise<PdfFileContent> => {
  const supabase = createPublicServerSupabaseClient();
  const { data, error } = await supabase
    .from('resume_contents')
    .select('*')
    .eq('locale', locale)
    .maybeSingle<PdfFileContent>();

  if (error) throw new Error(`[resume] 내용 조회 실패: ${error.message}`);

  if (data) return data;

  if (locale !== 'ko') {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('resume_contents')
      .select('*')
      .eq('locale', 'ko')
      .maybeSingle<PdfFileContent>();

    if (fallbackError) throw new Error(`[resume] fallback(ko) 조회 실패: ${fallbackError.message}`);
    if (fallbackData) return fallbackData;
  }

  throw new Error(
    `[resume] locale(${locale})와 fallback(ko) 데이터가 모두 비어 있습니다. resume_contents를 먼저 시딩해 주세요.`,
  );
};
