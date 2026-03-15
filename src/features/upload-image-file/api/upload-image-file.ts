import type { EditorContentType } from '@/entities/editor/model/editor-types';
import type { EditorImageUploadKind } from '@/shared/lib/image/image-upload-kind';
import { createUniqueStorageFileName } from '@/shared/lib/storage/create-unique-storage-file-name';
import { createStoragePath, STORAGE_BUCKET } from '@/shared/lib/storage/storage-path';
import { createServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

type UploadImageFileOptions = {
  contentType: EditorContentType;
  file: File;
  imageKind: EditorImageUploadKind;
};

const resolveImageBucket = (contentType: EditorContentType) => {
  if (contentType === 'project') return STORAGE_BUCKET.project;

  return STORAGE_BUCKET.article;
};

const resolveImageDirectory = (imageKind: EditorImageUploadKind) =>
  imageKind === 'thumbnail' ? 'thumbnails' : 'images';

/**
 * 관리자 편집 화면에서 업로드한 썸네일/본문 이미지를 Supabase Storage에 저장합니다.
 */
export const uploadImageFile = async ({ contentType, file, imageKind }: UploadImageFileOptions) => {
  const supabase = createServiceRoleSupabaseClient();
  const bucket = resolveImageBucket(contentType);
  const fileName = createUniqueStorageFileName(file.name);
  const filePath = createStoragePath(resolveImageDirectory(imageKind), fileName);
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    contentType: file.type || 'image/*',
    upsert: false,
  });

  if (error) {
    throw new Error(`[image-upload] 파일 업로드 실패: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return data.publicUrl;
};
