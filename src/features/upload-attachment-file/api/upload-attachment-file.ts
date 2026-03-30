import type { EditorContentType } from '@/entities/editor/model/editor-types';
import { createUniqueStorageFileName } from '@/shared/lib/storage/create-unique-storage-file-name';
import { createStoragePath, STORAGE_BUCKET } from '@/shared/lib/storage/storage-path';
import { createServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

type UploadAttachmentFileOptions = {
  contentType: EditorContentType;
  file: File;
};

/**
 * 관리자 편집 화면에서 업로드한 첨부 파일을 file 버킷에 저장하고 공개 메타데이터를 반환합니다.
 */
export const uploadAttachmentFile = async ({ contentType, file }: UploadAttachmentFileOptions) => {
  const supabase = createServiceRoleSupabaseClient();
  const fileName = createUniqueStorageFileName(file.name);
  const filePath = createStoragePath(contentType, 'attachments', fileName);
  const { error } = await supabase.storage.from(STORAGE_BUCKET.file).upload(filePath, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });

  if (error) {
    throw new Error(`[attachment-upload] 파일 업로드 실패: ${error.message}`);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET.file).getPublicUrl(filePath);

  return {
    contentType: file.type || 'application/octet-stream',
    fileName: file.name,
    fileSize: file.size,
    url: data.publicUrl,
  };
};
