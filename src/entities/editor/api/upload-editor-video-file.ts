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

const VIDEO_MIME_BY_EXTENSION = {
  m4v: 'video/x-m4v',
  mov: 'video/quicktime',
  mp4: 'video/mp4',
  webm: 'video/webm',
} as const;

/**
 * 파일명과 File.type을 기준으로 Storage 업로드에 사용할 MIME을 정규화합니다.
 *
 * @param file 업로드할 영상 파일입니다.
 * @returns storage metadata에 기록할 정규화된 MIME 타입을 반환합니다.
 */
const resolveVideoContentType = (file: File) => {
  const baseName = file.name.trim().split('/').pop()?.split('\\').pop()?.trim() ?? '';
  const lastDotIndex = baseName.lastIndexOf('.');

  if (lastDotIndex > 0 && lastDotIndex < baseName.length - 1) {
    const extension = baseName
      .slice(lastDotIndex + 1)
      .toLowerCase() as keyof typeof VIDEO_MIME_BY_EXTENSION;

    if (extension in VIDEO_MIME_BY_EXTENSION) {
      return VIDEO_MIME_BY_EXTENSION[extension];
    }
  }

  return file.type || 'application/octet-stream';
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
    contentType: resolveVideoContentType(file),
    errorPrefix: 'video-upload',
    errorSubject: '영상',
    file,
    filePath,
    includePublicUrl: true,
    supabase,
  });

  return publicUrl;
};
