import type { EditorContentType } from '@/entities/editor/model/editor-types';
import type { EditorImageUploadKind } from '@/shared/lib/image/image-upload-kind';
import { createUniqueStorageFileName } from '@/shared/lib/storage/create-unique-storage-file-name';
import {
  createContentStoragePath,
  resolveEditorContentStorageBucket,
  STORAGE_DIRECTORY,
} from '@/shared/lib/storage/storage-path';
import { uploadStorageFile } from '@/shared/lib/storage/upload-storage-file';
import { createServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

type UploadImageFileOptions = {
  contentType: EditorContentType;
  file: File;
  imageKind: EditorImageUploadKind;
};

/**
 * 업로드 용도에 따라 Storage 디렉터리 이름을 결정합니다.
 *
 * @param imageKind 업로드할 이미지의 용도입니다. `thumbnail`이면 썸네일, 그 외는 본문 이미지로 취급합니다.
 * @returns `thumbnail`은 `thumbnails`, 나머지는 `images` 디렉터리 이름을 반환합니다.
 */
const resolveImageDirectory = (imageKind: EditorImageUploadKind) =>
  imageKind === 'thumbnail' ? STORAGE_DIRECTORY.thumbnails : STORAGE_DIRECTORY.images;

/**
 * 관리자 편집 화면에서 업로드한 썸네일/본문 이미지를 Supabase Storage에 저장합니다.
 */
export const uploadEditorImageFile = async ({
  contentType,
  file,
  imageKind,
}: UploadImageFileOptions) => {
  const supabase = createServiceRoleSupabaseClient();
  const bucket = resolveEditorContentStorageBucket(contentType);
  const fileName = createUniqueStorageFileName(file.name);
  const filePath = createContentStoragePath(resolveImageDirectory(imageKind), fileName);
  const { publicUrl } = await uploadStorageFile({
    bucketName: bucket,
    contentType: file.type || 'image/*',
    errorPrefix: 'image-upload',
    file,
    filePath,
    includePublicUrl: true,
    supabase,
  });

  return publicUrl;
};
