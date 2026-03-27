import { PHOTO_STORAGE_BUCKET } from '@/entities/hero-photo/model/config';
import type { PhotoFileItem } from '@/entities/hero-photo/model/types';
import { createUniqueStorageFileName } from '@/shared/lib/storage/create-unique-storage-file-name';
import { createServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

/**
 * 새로 업로드한 Storage 파일과 브라우저 응답에 필요한 메타데이터를 합칩니다.
 */
const createUploadedPhotoItem = ({
  file,
  filePath,
  publicUrl,
}: {
  file: File;
  filePath: string;
  publicUrl: string;
}): PhotoFileItem => ({
  createdAt: new Date().toISOString(),
  fileName: filePath,
  filePath,
  mimeType: file.type || 'application/octet-stream',
  publicUrl,
  size: file.size,
});

/**
 * 관리자가 업로드한 사진을 `photo` 버킷에 저장하고 공개 접근 정보를 반환합니다.
 */
export const uploadPhotoFile = async ({ file }: { file: File }): Promise<PhotoFileItem> => {
  const supabase = createServiceRoleSupabaseClient();
  const storage = supabase.storage.from(PHOTO_STORAGE_BUCKET);
  const filePath = createUniqueStorageFileName(file.name);
  const { error } = await storage.upload(filePath, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });

  if (error) {
    throw new Error(`[photo-file] 사진 업로드 실패: ${error.message}`);
  }

  const { data } = storage.getPublicUrl(filePath);

  return createUploadedPhotoItem({
    file,
    filePath,
    publicUrl: data.publicUrl,
  });
};
