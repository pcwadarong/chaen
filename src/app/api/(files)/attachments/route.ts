import { isAllowedEditorAttachmentFile, uploadEditorAttachmentFile } from '@/entities/editor';
import { EDITOR_API_ERROR_MESSAGE } from '@/entities/editor/model/editor-api-error';
import type { EditorContentType } from '@/entities/editor/model/editor-types';
import { API_INTERNAL_ERROR_MESSAGE } from '@/shared/lib/http/api-error-catalog';
import { createApiErrorResponse } from '@/shared/lib/http/api-response';
import { runJsonRoute } from '@/shared/lib/http/run-json-route';

const contentTypes: EditorContentType[] = ['article', 'project', 'resume'];

/**
 * 관리자 편집 화면의 첨부 파일 업로드 요청을 처리합니다.
 */
export const POST = async (request: Request) =>
  runJsonRoute({
    adminOnly: true,
    action: async () => {
      const formData = await request.formData();
      const file = formData.get('file');
      const contentType = formData.get('contentType');

      if (!(file instanceof File))
        return createApiErrorResponse(EDITOR_API_ERROR_MESSAGE.attachmentUploadMissingFile, 400);

      if (
        typeof contentType !== 'string' ||
        !contentTypes.includes(contentType as EditorContentType) ||
        !isAllowedEditorAttachmentFile(file)
      ) {
        return createApiErrorResponse(EDITOR_API_ERROR_MESSAGE.attachmentUploadInvalidPayload, 400);
      }

      return uploadEditorAttachmentFile({
        contentType: contentType as EditorContentType,
        file,
      });
    },
    errorMessage: API_INTERNAL_ERROR_MESSAGE.attachmentUploadFailed,
  });
