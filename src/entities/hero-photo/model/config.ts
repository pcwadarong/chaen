/**
 * 사진 업로드용 Supabase Storage 버킷 이름입니다.
 */
export const PHOTO_STORAGE_BUCKET = 'photo';

/**
 * 관리자 사진 업로드에서 허용하는 MIME 타입 집합입니다.
 */
export const PHOTO_FILE_ALLOWED_MIME_TYPES = [
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/png',
] as const;

/**
 * 전달된 MIME 타입이 관리자 사진 업로드 허용 포맷인지 확인합니다.
 */
export const isAllowedPhotoFileMimeType = (
  mimeType: string,
): mimeType is (typeof PHOTO_FILE_ALLOWED_MIME_TYPES)[number] =>
  PHOTO_FILE_ALLOWED_MIME_TYPES.includes(
    mimeType as (typeof PHOTO_FILE_ALLOWED_MIME_TYPES)[number],
  );
