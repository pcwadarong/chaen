import { PHOTO_STORAGE_BUCKET } from '@/entities/hero-photo/model/config';
import type { PhotoFileItem } from '@/entities/hero-photo/model/types';
import { createUniqueStorageFileName } from '@/shared/lib/storage/create-unique-storage-file-name';
import { createServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

/**
 * 새로 업로드한 Storage 파일과 브라우저 응답에 필요한 메타데이터를 합칩니다.
 */
const createUploadedPhotoItem = ({
  createdAt,
  file,
  filePath,
  publicUrl,
}: {
  createdAt: string;
  file: File;
  filePath: string;
  publicUrl: string;
}): PhotoFileItem => ({
  createdAt,
  fileName: filePath,
  filePath,
  mimeType: file.type || 'application/octet-stream',
  publicUrl,
  size: file.size,
});

/**
 * Supabase 업로드 응답에서 서버 기준 생성 시각을 우선 추출합니다.
 * 응답 구조가 환경마다 다를 수 있어 `created_at`과 `metadata.created_at`을 모두 확인합니다.
 */
const resolveUploadedPhotoCreatedAt = (uploadData: unknown): string => {
  if (uploadData && typeof uploadData === 'object') {
    const uploadDataWithCreatedAt = uploadData as {
      created_at?: unknown;
      metadata?: {
        created_at?: unknown;
      };
    };

    if (typeof uploadDataWithCreatedAt.created_at === 'string') {
      return uploadDataWithCreatedAt.created_at;
    }

    if (typeof uploadDataWithCreatedAt.metadata?.created_at === 'string') {
      return uploadDataWithCreatedAt.metadata.created_at;
    }
  }

  return new Date().toISOString();
};

/**
 * 관리자가 업로드한 사진을 `photo` 버킷에 저장하고 공개 접근 정보를 반환합니다.
 */
export const uploadPhotoFile = async ({ file }: { file: File }): Promise<PhotoFileItem> => {
  const supabase = createServiceRoleSupabaseClient();
  const storage = supabase.storage.from(PHOTO_STORAGE_BUCKET);
  const filePath = createUniqueStorageFileName(file.name);
  const uploadResult = await storage.upload(filePath, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  const { error } = uploadResult;

  if (error) {
    throw new Error(`[photo-file] 사진 업로드 실패: ${error.message}`);
  }

  const { data } = storage.getPublicUrl(filePath);

  return createUploadedPhotoItem({
    createdAt: resolveUploadedPhotoCreatedAt(uploadResult.data),
    file,
    filePath,
    publicUrl: data.publicUrl,
  });
};
