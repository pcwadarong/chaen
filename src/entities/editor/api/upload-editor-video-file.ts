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

type UploadVideoFileOptions = {
  contentType: EditorContentType;
  file: File;
};

/**
 * 관리자 편집 화면에서 업로드한 영상 파일을 각 콘텐츠 버킷의 videos 경로에 저장하고 공개 URL을 반환합니다.
 *
 * @param options 콘텐츠 종류와 업로드할 영상 파일입니다.
 * @returns 업로드된 영상의 공개 URL을 반환합니다.
 */
export const uploadEditorVideoFile = async ({ contentType, file }: UploadVideoFileOptions) => {
  const supabase = await resolveStorageWriteSupabaseClient();
  const bucket = resolveEditorContentStorageBucket(contentType);
  const fileName = createUniqueStorageFileName(file.name);
  const filePath = createContentStoragePath(STORAGE_DIRECTORY.videos, fileName);
  const { publicUrl } = await uploadStorageFile({
    bucketName: bucket,
    contentType: file.type || 'video/mp4',
    errorPrefix: 'video-upload',
    errorSubject: '영상',
    file,
    filePath,
    includePublicUrl: true,
    supabase,
  });

  return publicUrl;
};
