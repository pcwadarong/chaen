import { deletePhotoFile } from '@/entities/hero-photo/api/delete-photo-file';
import { uploadPhotoFile } from '@/entities/hero-photo/api/upload-photo-file';
import { isAllowedPhotoFileMimeType } from '@/entities/hero-photo/model/config';
import { createApiErrorResponse } from '@/shared/lib/http/api-response';
import { runJsonRoute } from '@/shared/lib/http/run-json-route';

const PHOTO_UPLOAD_INVALID_PAYLOAD_ERROR_MESSAGE =
  'PNG, JPG, JPEG, HEIC, HEIF 형식의 사진 파일만 업로드할 수 있습니다.';
const PHOTO_DELETE_INVALID_PAYLOAD_ERROR_MESSAGE = '삭제할 사진 경로가 올바르지 않습니다.';

/**
 * 관리자 사진 보관함 업로드 요청을 처리합니다.
 */
export const POST = async (request: Request) =>
  runJsonRoute({
    adminOnly: true,
    action: async () => {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!(file instanceof File) || !isAllowedPhotoFileMimeType(file.type)) {
        return createApiErrorResponse(PHOTO_UPLOAD_INVALID_PAYLOAD_ERROR_MESSAGE, 400);
      }

      return {
        item: await uploadPhotoFile({
          file,
        }),
      };
    },
    errorMessage: 'Photo upload failed',
  });

/**
 * 관리자 사진 보관함 삭제 요청을 처리합니다.
 */
export const DELETE = async (request: Request) =>
  runJsonRoute({
    adminOnly: true,
    action: async () => {
      const body = (await request.json().catch(() => null)) as {
        filePath?: unknown;
      } | null;
      const filePath = typeof body?.filePath === 'string' ? body.filePath.trim() : '';

      if (!filePath) {
        return createApiErrorResponse(PHOTO_DELETE_INVALID_PAYLOAD_ERROR_MESSAGE, 400);
      }

      return deletePhotoFile({
        filePath,
      });
    },
    errorMessage: 'Photo delete failed',
  });
