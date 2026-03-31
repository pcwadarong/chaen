import type { EditorAttachment } from '@/entities/editor/model/editor-attachment';
import type { EditorContentType } from '@/entities/editor/model/editor-types';

type UploadEditorFileResponseBody = Partial<EditorAttachment> & {
  error?: string;
  message?: string;
};

/**
 * 에디터에서 선택한 첨부 파일을 업로드 API에 전달하고 첨부 메타데이터를 반환합니다.
 *
 * @param options 첨부 업로드 요청 정보입니다.
 * @param options.contentType 현재 편집 중인 콘텐츠 종류입니다.
 * @param options.file 업로드할 첨부 파일 객체입니다.
 * @returns 업로드에 성공한 첨부 파일의 공개 메타데이터를 반환합니다.
 * @throws 업로드 요청이 실패했거나 응답이 유효한 첨부 메타데이터를 담지 않으면 예외를 던집니다.
 */
export const uploadEditorFile = async ({
  contentType,
  file,
}: {
  contentType: EditorContentType;
  file: File;
}): Promise<EditorAttachment> => {
  const formData = new FormData();

  formData.set('contentType', contentType);
  formData.set('file', file);

  const response = await fetch('/api/attachments', {
    body: formData,
    method: 'POST',
  });
  let body: UploadEditorFileResponseBody = {};

  try {
    body = (await response.json()) as UploadEditorFileResponseBody;
  } catch {
    body = {
      error: response.ok ? 'Attachment response parse failed' : 'Attachment upload failed',
      message: response.statusText || undefined,
    };
  }

  if (
    !response.ok ||
    !body.url ||
    !body.fileName ||
    typeof body.fileSize !== 'number' ||
    !body.contentType
  ) {
    throw new Error(body.error ?? body.message ?? 'Attachment upload failed');
  }

  return {
    contentType: body.contentType,
    fileName: body.fileName,
    fileSize: body.fileSize,
    url: body.url,
  };
};
