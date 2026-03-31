const MB = 1024 * 1024;

export const EDITOR_VIDEO_MAX_FILE_SIZE = 200 * MB;

export const EDITOR_VIDEO_ALLOWED_EXTENSIONS = ['m4v', 'mov', 'mp4', 'webm'] as const;

export const EDITOR_VIDEO_ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
  'application/octet-stream',
] as const;

export const EDITOR_VIDEO_FILE_INPUT_ACCEPT = [
  ...EDITOR_VIDEO_ALLOWED_EXTENSIONS.map(extension => `.${extension}`),
  ...EDITOR_VIDEO_ALLOWED_MIME_TYPES,
].join(',');

/**
 * editor 영상 파일의 확장자 허용 여부를 판별합니다.
 *
 * @param fileName 업로드할 원본 파일명입니다.
 * @returns 허용된 영상 확장자인지 반환합니다.
 */
export const isAllowedEditorVideoExtension = (fileName: string) => {
  const baseName = fileName.trim().split('/').pop()?.split('\\').pop()?.trim() ?? '';
  const lastDotIndex = baseName.lastIndexOf('.');

  if (lastDotIndex <= 0 || lastDotIndex === baseName.length - 1) return false;

  const extension = baseName.slice(lastDotIndex + 1).toLowerCase();

  return EDITOR_VIDEO_ALLOWED_EXTENSIONS.includes(
    extension as (typeof EDITOR_VIDEO_ALLOWED_EXTENSIONS)[number],
  );
};

/**
 * editor 영상 파일의 MIME 타입과 크기가 정책을 만족하는지 판별합니다.
 *
 * @param file 업로드할 영상 파일입니다.
 * @returns 허용된 영상 업로드 정책을 만족하는지 반환합니다.
 */
export const isAllowedEditorVideoFile = (file: File) => {
  if (!file.name.trim() || file.size <= 0 || file.size > EDITOR_VIDEO_MAX_FILE_SIZE) {
    return false;
  }

  if (!isAllowedEditorVideoExtension(file.name)) {
    return false;
  }

  if (!file.type) {
    return true;
  }

  return EDITOR_VIDEO_ALLOWED_MIME_TYPES.includes(
    file.type as (typeof EDITOR_VIDEO_ALLOWED_MIME_TYPES)[number],
  );
};
