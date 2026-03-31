const MB = 1024 * 1024;

export const EDITOR_ATTACHMENT_MAX_FILE_SIZE = 50 * MB;

export const EDITOR_ATTACHMENT_ALLOWED_EXTENSIONS = [
  'csv',
  'doc',
  'docx',
  'hwp',
  'hwpx',
  'md',
  'pdf',
  'ppt',
  'pptx',
  'txt',
  'xls',
  'xlsx',
  'zip',
] as const;

export const EDITOR_ATTACHMENT_ALLOWED_MIME_TYPES = [
  'application/msword',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/x-hwp',
  'application/x-zip-compressed',
  'application/zip',
  'text/csv',
  'text/markdown',
  'text/plain',
] as const;

export const EDITOR_ATTACHMENT_FILE_INPUT_ACCEPT = EDITOR_ATTACHMENT_ALLOWED_EXTENSIONS.map(
  extension => `.${extension}`,
).join(',');

/**
 * editor 첨부 파일의 확장자 허용 여부를 판별합니다.
 *
 * @param fileName 업로드할 원본 파일명입니다.
 * @returns 허용된 첨부 확장자인지 반환합니다.
 */
export const isAllowedEditorAttachmentExtension = (fileName: string) => {
  const extension = fileName.trim().split('.').pop()?.toLowerCase();

  if (!extension) return false;

  return EDITOR_ATTACHMENT_ALLOWED_EXTENSIONS.includes(
    extension as (typeof EDITOR_ATTACHMENT_ALLOWED_EXTENSIONS)[number],
  );
};

/**
 * editor 첨부 파일의 MIME 타입과 크기가 정책을 만족하는지 판별합니다.
 *
 * @param file 업로드할 첨부 파일입니다.
 * @returns 허용된 첨부 파일 정책을 만족하는지 반환합니다.
 */
export const isAllowedEditorAttachmentFile = (file: File) => {
  if (!file.name.trim() || file.size <= 0 || file.size > EDITOR_ATTACHMENT_MAX_FILE_SIZE) {
    return false;
  }

  if (!isAllowedEditorAttachmentExtension(file.name)) {
    return false;
  }

  if (!file.type) {
    return true;
  }

  return EDITOR_ATTACHMENT_ALLOWED_MIME_TYPES.includes(
    file.type as (typeof EDITOR_ATTACHMENT_ALLOWED_MIME_TYPES)[number],
  );
};
