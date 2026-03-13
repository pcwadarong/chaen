import { uploadImageFile } from '@/features/upload-image-file/api/upload-image-file';
import { createApiErrorResponse } from '@/shared/lib/http/api-response';
import { runJsonRoute } from '@/shared/lib/http/run-json-route';
import type { EditorContentType } from '@/widgets/editor/model/editor-core.types';

const contentTypes: EditorContentType[] = ['article', 'project', 'resume'];

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

      if (!(file instanceof File)) {
        return createApiErrorResponse('Image file is required', 400);
      }

      if (
        typeof contentType !== 'string' ||
        !contentTypes.includes(contentType as EditorContentType) ||
        !file.type.startsWith('image/')
      ) {
        return createApiErrorResponse('Invalid image upload payload', 400);
      }

      return {
        url: await uploadImageFile({
          contentType: contentType as EditorContentType,
          file,
        }),
      };
    },
    errorMessage: 'Image upload failed',
  });
