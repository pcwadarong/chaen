import { NextResponse } from 'next/server';

import { createApiErrorResponse } from '@/shared/lib/http/api-response';
import { isEditorContentStorageBucket } from '@/shared/lib/storage/storage-path';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

const ATTACHMENT_DOWNLOAD_NOT_FOUND_MESSAGE = 'Not Found';
const ATTACHMENT_DOWNLOAD_INVALID_REQUEST_MESSAGE = 'Invalid attachment download request';
const ATTACHMENT_SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 10;

/**
 * 다운로드 요청 path가 editor attachment 경로 규칙을 따르는지 검증합니다.
 *
 * @param filePath 다운로드 요청에 포함된 storage object path입니다.
 * @returns 허용 가능한 attachment 경로인지 여부를 반환합니다.
 */
const isAllowedAttachmentPath = (filePath: string) => {
  if (filePath.startsWith('/')) return false;

  const segments = filePath.split('/');
  const [firstSegment, ...restSegments] = segments;

  if (firstSegment !== 'attachments' || restSegments.length === 0) {
    return false;
  }

  return segments.every(segment => segment.length > 0 && segment !== '.' && segment !== '..');
};

/**
 * 내부 첨부 파일 다운로드 경로를 signed URL 생성 플로우로 위임합니다.
 */
export const GET = async (request: Request) => {
  const requestUrl = new URL(request.url);
  const bucketName = requestUrl.searchParams.get('bucket')?.trim();
  const filePath = requestUrl.searchParams.get('path')?.trim();
  const fileName = requestUrl.searchParams.get('fileName')?.trim();

  if (
    !bucketName ||
    !isEditorContentStorageBucket(bucketName) ||
    !filePath ||
    !fileName ||
    !isAllowedAttachmentPath(filePath)
  ) {
    return createApiErrorResponse(ATTACHMENT_DOWNLOAD_INVALID_REQUEST_MESSAGE, 400);
  }

  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) {
    return createApiErrorResponse(ATTACHMENT_DOWNLOAD_NOT_FOUND_MESSAGE, 404);
  }

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, ATTACHMENT_SIGNED_URL_EXPIRES_IN_SECONDS, {
      download: fileName,
    });

  if (error || !data?.signedUrl) {
    return createApiErrorResponse(ATTACHMENT_DOWNLOAD_NOT_FOUND_MESSAGE, 404);
  }

  return NextResponse.redirect(data.signedUrl);
};
