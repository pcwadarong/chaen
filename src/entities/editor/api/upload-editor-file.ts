import type { EditorAttachment } from '@/entities/editor/model/editor-attachment';
import type { EditorContentType } from '@/entities/editor/model/editor-types';

/**
 * 에디터에서 선택한 첨부 파일을 업로드 API에 전달하고 공개 메타데이터를 반환합니다.
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
  const body = (await response.json()) as Partial<EditorAttachment> & {
    error?: string;
    message?: string;
  };

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
