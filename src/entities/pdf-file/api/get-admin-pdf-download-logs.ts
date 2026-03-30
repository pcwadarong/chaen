import type { PdfFileDownloadLog } from '@/entities/pdf-file/model/types';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

/**
 * 관리자 분석 화면에 노출할 최근 PDF 다운로드 로그를 읽습니다.
 */
export const getAdminPdfDownloadLogs = async ({
  limit = 20,
}: {
  limit?: number;
}): Promise<PdfFileDownloadLog[]> => {
  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('pdf_download_logs')
    .select(
      'id,asset_key,kind,file_locale,source,utm_source,referer,referer_path,device_type,country_code,ip,created_at',
    )
    .order('created_at', {
      ascending: false,
    })
    .limit(limit);

  if (error) {
    throw new Error(`[admin-pdf-logs] 로그 조회 실패: ${error.message}`);
  }

  return (data ?? []) as PdfFileDownloadLog[];
};
