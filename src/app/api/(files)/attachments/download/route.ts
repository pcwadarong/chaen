import { createApiErrorResponse } from '@/shared/lib/http/api-response';
import { STORAGE_BUCKET } from '@/shared/lib/storage/storage-path';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

const ATTACHMENT_DOWNLOAD_NOT_FOUND_MESSAGE = 'Not Found';
const ATTACHMENT_DOWNLOAD_INVALID_REQUEST_MESSAGE = 'Invalid attachment download request';
const ATTACHMENT_SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 10;

/**
 * 내부 첨부 파일 다운로드 경로를 signed URL 생성 플로우로 위임합니다.
 */
export const GET = async (request: Request) => {
  const requestUrl = new URL(request.url);
  const filePath = requestUrl.searchParams.get('path')?.trim();
  const fileName = requestUrl.searchParams.get('fileName')?.trim();

  if (!filePath || !fileName) {
    return createApiErrorResponse(ATTACHMENT_DOWNLOAD_INVALID_REQUEST_MESSAGE, 400);
  }

  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) {
    return createApiErrorResponse(ATTACHMENT_DOWNLOAD_NOT_FOUND_MESSAGE, 404);
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET.file)
    .createSignedUrl(filePath, ATTACHMENT_SIGNED_URL_EXPIRES_IN_SECONDS, {
      download: fileName,
    });

  if (error || !data?.signedUrl) {
    return createApiErrorResponse(ATTACHMENT_DOWNLOAD_NOT_FOUND_MESSAGE, 404);
  }

  return Response.redirect(data.signedUrl);
};
