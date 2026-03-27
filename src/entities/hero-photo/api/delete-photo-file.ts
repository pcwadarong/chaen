import { PHOTO_STORAGE_BUCKET } from '@/entities/hero-photo/model/config';
import { createServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

/**
 * `photo` 버킷에서 지정한 파일 경로를 제거합니다.
 */
export const deletePhotoFile = async ({
  filePath,
}: {
  filePath: string;
}): Promise<{
  filePath: string;
}> => {
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.storage.from(PHOTO_STORAGE_BUCKET).remove([filePath]);

  if (error) {
    throw new Error(`[photo-file] 사진 삭제 실패: ${error.message}`);
  }

  return {
    filePath,
  };
};
