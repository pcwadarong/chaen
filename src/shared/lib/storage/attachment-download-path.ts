import {
  type EditorContentStorageBucket,
  isEditorContentStorageBucket,
} from '@/shared/lib/storage/storage-path';

const SUPABASE_PUBLIC_STORAGE_PREFIX = '/storage/v1/object/public/';

type AttachmentStorageLocation = {
  bucketName: EditorContentStorageBucket;
  filePath: string;
};

/**
 * 같은 origin의 내부 첨부 파일 다운로드 경로를 생성합니다.
 */
export const buildAttachmentDownloadPath = ({
  bucketName,
  fileName,
  filePath,
}: {
  bucketName: AttachmentStorageLocation['bucketName'];
  fileName: string;
  filePath: string;
}) => {
  const searchParams = new URLSearchParams({
    bucket: bucketName,
    fileName,
    path: filePath,
  });

  return `/api/attachments/download?${searchParams.toString()}`;
};

/**
 * Supabase public storage URL에서 콘텐츠 버킷 첨부 파일의 실제 storage 위치를 추출합니다.
 */
export const parseAttachmentStoragePath = (href: string): AttachmentStorageLocation | null => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) return null;

  try {
    const parsedHref = new URL(href);
    const parsedSupabaseUrl = new URL(supabaseUrl);

    if (parsedHref.origin !== parsedSupabaseUrl.origin) return null;

    const storagePrefix = `${SUPABASE_PUBLIC_STORAGE_PREFIX}`;
    if (!parsedHref.pathname.startsWith(storagePrefix)) return null;

    const encodedStoragePath = parsedHref.pathname.slice(storagePrefix.length);
    const [bucketName, ...encodedFilePathSegments] = encodedStoragePath.split('/');
    const encodedFilePath = encodedFilePathSegments.join('/');

    if (!bucketName || !encodedFilePath) return null;

    if (!isEditorContentStorageBucket(bucketName)) return null;

    return {
      bucketName,
      filePath: decodeURIComponent(encodedFilePath),
    };
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
  const storageLocation = parseAttachmentStoragePath(href);
  if (!storageLocation) return href;

  return buildAttachmentDownloadPath({
    bucketName: storageLocation.bucketName,
    fileName,
    filePath: storageLocation.filePath,
  });
};
