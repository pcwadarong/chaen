import { createUniqueStorageFileName } from '@/shared/lib/storage/create-unique-storage-file-name';
import {
  type ContentStorageBucket,
  createStoragePath,
  STORAGE_DIRECTORY,
} from '@/shared/lib/storage/storage-path';
import { uploadStorageFile } from '@/shared/lib/storage/upload-storage-file';
import {
  resolveStorageWriteSupabaseClient,
  type StorageWriteSupabaseClient,
} from '@/shared/lib/supabase/storage-client';

import 'server-only';

type UploadPdfFileOptions = {
  bucket: ContentStorageBucket;
  directory?: string;
  file: File;
  filePath?: string;
  supabase?: StorageWriteSupabaseClient;
  upsert?: boolean;
};

const DEFAULT_PDF_FILE_DIRECTORY = `${STORAGE_DIRECTORY.pdf}/`;

/**
 * Supabase Storage의 대상 버킷 경로에 PDF 파일을 업로드합니다.
 * 업로드 파일명은 UUID 기반으로 난수화되어 덮어쓰기 위험을 줄입니다.
 */
export const uploadPdfFile = async ({
  bucket,
  directory = DEFAULT_PDF_FILE_DIRECTORY,
  file,
  filePath,
  supabase,
  upsert = false,
}: UploadPdfFileOptions): Promise<string> => {
  const storageSupabase = supabase ?? (await resolveStorageWriteSupabaseClient());
  const resolvedDirectory = directory?.trim() || DEFAULT_PDF_FILE_DIRECTORY;
  const resolvedFilePath =
    filePath ?? createStoragePath(resolvedDirectory, createUniqueStorageFileName(file.name));
  const { filePath: uploadedFilePath } = await uploadStorageFile({
    bucketName: bucket,
    contentType: file.type || 'application/pdf',
    errorPrefix: 'pdf-file',
    file,
    filePath: resolvedFilePath,
    supabase: storageSupabase,
    upsert,
  });

  return uploadedFilePath;
};
