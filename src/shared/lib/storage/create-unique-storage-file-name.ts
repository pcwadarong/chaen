const STORAGE_FILE_FALLBACK_BASE_NAME = 'file';

/**
 * 스토리지 파일명에 사용할 ASCII basename을 생성합니다.
 * 한글/공백/기호는 제거하거나 `-`로 치환해 Supabase Storage 경로에서 안전하게 사용합니다.
 */
const sanitizeStorageFileBaseName = (rawBaseName: string) => {
  const normalizedBaseName = rawBaseName
    .normalize('NFKD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const sanitizedBaseName = normalizedBaseName
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-+|-+$/g, '');

  return sanitizedBaseName || STORAGE_FILE_FALLBACK_BASE_NAME;
};

/**
 * 스토리지 파일명에 사용할 확장자를 ASCII 소문자로 정리합니다.
 */
const sanitizeStorageFileExtension = (rawExtension: string) =>
  rawExtension
    .normalize('NFKD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '');

/**
 * 원본 파일명을 storage-safe ASCII 이름으로 정리한 뒤 UUID를 붙여 충돌을 방지합니다.
 */
export const createUniqueStorageFileName = (originalFileName: string) => {
  const trimmedFileName = originalFileName.trim();
  const extensionIndex = trimmedFileName.lastIndexOf('.');
  const hasExtension = extensionIndex > 0 && extensionIndex < trimmedFileName.length - 1;
  const rawBaseName = hasExtension ? trimmedFileName.slice(0, extensionIndex) : trimmedFileName;
  const rawExtension = hasExtension ? trimmedFileName.slice(extensionIndex + 1) : '';
  const sanitizedBaseName = sanitizeStorageFileBaseName(rawBaseName);
  const sanitizedExtension = sanitizeStorageFileExtension(rawExtension);
  const resolvedFileName = sanitizedExtension
    ? `${sanitizedBaseName}.${sanitizedExtension}`
    : sanitizedBaseName;

  return `${crypto.randomUUID()}-${resolvedFileName}`;
};
