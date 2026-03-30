import type { PdfFileDownloadLog } from '@/entities/pdf-file/model/types';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

/**
 * 관리자 대시보드와 분석 패널에 노출할 최근 PDF 다운로드 로그를 조회합니다.
 *
 * `limit`는 조회할 최대 개수를 의미하며, 기본값은 `20`입니다.
 * 호출자가 음수, 소수, 과도하게 큰 값을 넘기더라도 내부에서 정수로 보정한 뒤
 * 최소 `1`, 최대 `100` 범위로 제한해 데이터베이스에 전달합니다.
 *
 * 반환값은 `Promise<PdfFileDownloadLog[]>`이며, 각 항목에는 다운로드 로그 식별자(`id`),
 * 파일 키(`asset_key`), 다운로드 종류(`kind`), 파일 로케일(`file_locale`),
 * 유입 정보(`source`, `utm_source`, `referer`, `referer_path`)와 생성 시각(`created_at`) 등이 포함됩니다.
 * 실제 반환 개수는 보정된 `limit` 이하입니다.
 *
 * 서비스 롤 Supabase 클라이언트를 만들 수 없는 환경에서는 예외를 던지지 않고 빈 배열을 반환합니다.
 * 반면 데이터베이스 조회 오류나 권한 오류가 발생하면 `Error`를 던지므로 호출자는 `await` 시 예외 가능성을 고려해야 합니다.
 */
export const getAdminPdfDownloadLogs = async ({
  limit = 20,
}: {
  limit?: number;
}): Promise<PdfFileDownloadLog[]> => {
  const sanitizedLimit = Math.min(100, Math.max(1, Math.floor(limit)));
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
    .limit(sanitizedLimit);

  if (error) {
    throw new Error(`[admin-pdf-logs] 로그 조회 실패: ${error.message}`);
  }

  return (data ?? []) as PdfFileDownloadLog[];
};
