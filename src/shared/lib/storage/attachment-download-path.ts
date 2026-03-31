import { STORAGE_BUCKET } from '@/shared/lib/storage/storage-path';

const SUPABASE_PUBLIC_STORAGE_PREFIX = '/storage/v1/object/public/';

/**
 * 같은 origin의 내부 첨부 파일 다운로드 경로를 생성합니다.
 */
export const buildAttachmentDownloadPath = ({
  fileName,
  filePath,
}: {
  fileName: string;
  filePath: string;
}) => {
  const searchParams = new URLSearchParams({
    fileName,
    path: filePath,
  });

  return `/api/attachments/download?${searchParams.toString()}`;
};

/**
 * Supabase public storage URL에서 file 버킷의 실제 object path를 추출합니다.
 */
export const parseAttachmentStoragePath = (href: string): string | null => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) return null;

  try {
    const parsedHref = new URL(href);
    const parsedSupabaseUrl = new URL(supabaseUrl);

    if (parsedHref.origin !== parsedSupabaseUrl.origin) return null;

    const storagePrefix = `${SUPABASE_PUBLIC_STORAGE_PREFIX}${STORAGE_BUCKET.file}/`;
    if (!parsedHref.pathname.startsWith(storagePrefix)) return null;

    const encodedFilePath = parsedHref.pathname.slice(storagePrefix.length);
    if (!encodedFilePath) return null;

    return decodeURIComponent(encodedFilePath);
  } catch {
    return null;
  }
};

/**
 * 첨부 파일 href가 Supabase public URL이면 내부 다운로드 route로 변환합니다.
 */
export const resolveAttachmentDownloadHref = ({
  fileName,
  href,
}: {
  fileName: string;
  href: string;
}) => {
  const filePath = parseAttachmentStoragePath(href);
  if (!filePath) return href;

  return buildAttachmentDownloadPath({
    fileName,
    filePath,
  });
};
