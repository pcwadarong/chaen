import { PDF_DOWNLOAD_LOG_TABLE_NAME } from '@/entities/pdf-file/model/download-log';
import type { CreatePdfDownloadLogInput } from '@/entities/pdf-file/model/types';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

/**
 * PDF 다운로드 로그를 저장합니다.
 * service role 환경이 없으면 조용히 건너뜁니다.
 */
export const createPdfDownloadLog = async (input: CreatePdfDownloadLogInput): Promise<boolean> => {
  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase.from(PDF_DOWNLOAD_LOG_TABLE_NAME).insert({
    asset_key: input.assetKey,
    country_code: input.countryCode,
    device_type: input.deviceType,
    file_locale: input.fileLocale,
    ip: input.ip,
    kind: input.kind,
    referer: input.referer,
    referer_path: input.refererPath,
    source: input.source,
    utm_source: input.utmSource,
  });

  if (error) {
    throw new Error(`[pdf-file:${input.assetKey}] download log 저장 실패: ${error.message}`);
  }

  return true;
};
