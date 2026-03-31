import type { EditorContentType } from '@/entities/editor/model/editor-types';
import { createUniqueStorageFileName } from '@/shared/lib/storage/create-unique-storage-file-name';
import {
  createContentStoragePath,
  resolveEditorContentStorageBucket,
  STORAGE_DIRECTORY,
} from '@/shared/lib/storage/storage-path';
import { uploadStorageFile } from '@/shared/lib/storage/upload-storage-file';
import { resolveStorageWriteSupabaseClient } from '@/shared/lib/supabase/storage-client';

import 'server-only';

type UploadAttachmentFileOptions = {
  contentType: EditorContentType;
  file: File;
};

/**
 * 관리자 편집 화면에서 업로드한 첨부 파일을 각 콘텐츠 버킷의 attachments 경로에 저장하고 공개 메타데이터를 반환합니다.
 */
export const uploadEditorAttachmentFile = async ({
  contentType,
  file,
}: UploadAttachmentFileOptions) => {
  const supabase = await resolveStorageWriteSupabaseClient();
  const bucket = resolveEditorContentStorageBucket(contentType);
  const fileName = createUniqueStorageFileName(file.name);
  const filePath = createContentStoragePath(STORAGE_DIRECTORY.attachments, fileName);
  const { publicUrl } = await uploadStorageFile({
    bucketName: bucket,
    contentType: file.type || 'application/octet-stream',
    errorPrefix: 'attachment-upload',
    file,
    filePath,
    includePublicUrl: true,
    supabase,
  });

  return {
    contentType: file.type || 'application/octet-stream',
    fileName: file.name,
    fileSize: file.size,
    url: publicUrl,
  };
};
