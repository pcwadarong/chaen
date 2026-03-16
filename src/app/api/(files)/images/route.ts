import { EDITOR_API_ERROR_MESSAGE } from '@/entities/editor/model/editor-api-error';
import type { EditorContentType } from '@/entities/editor/model/editor-types';
import { uploadImageFile } from '@/features/upload-image-file/api/upload-image-file';
import { API_INTERNAL_ERROR_MESSAGE } from '@/shared/lib/http/api-error-catalog';
import { createApiErrorResponse } from '@/shared/lib/http/api-response';
import { runJsonRoute } from '@/shared/lib/http/run-json-route';
import type { EditorImageUploadKind } from '@/shared/lib/image/image-upload-kind';

const contentTypes: EditorContentType[] = ['article', 'project', 'resume'];
const imageKinds: EditorImageUploadKind[] = ['content', 'thumbnail'];

/**
 * 관리자 편집 화면의 이미지 업로드 요청을 처리합니다.
 */
export const POST = async (request: Request) =>
  runJsonRoute({
    adminOnly: true,
    action: async () => {
      const formData = await request.formData();
      const file = formData.get('file');
      const contentType = formData.get('contentType');
      const imageKind = formData.get('imageKind');

      if (!(file instanceof File)) {
        return createApiErrorResponse(EDITOR_API_ERROR_MESSAGE.imageUploadMissingFile, 400);
      }

      if (
        typeof contentType !== 'string' ||
        typeof imageKind !== 'string' ||
        !contentTypes.includes(contentType as EditorContentType) ||
        !imageKinds.includes(imageKind as EditorImageUploadKind) ||
        !file.type.startsWith('image/')
      ) {
        return createApiErrorResponse(EDITOR_API_ERROR_MESSAGE.imageUploadInvalidPayload, 400);
      }

      return {
        url: await uploadImageFile({
          contentType: contentType as EditorContentType,
          file,
          imageKind: imageKind as EditorImageUploadKind,
        }),
      };
    },
    errorMessage: API_INTERNAL_ERROR_MESSAGE.imageUploadFailed,
  });
