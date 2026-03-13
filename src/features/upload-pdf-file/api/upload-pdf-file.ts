import { createUniqueStorageFileName } from '@/shared/lib/storage/create-unique-storage-file-name';
import { createStoragePath, STORAGE_BUCKET } from '@/shared/lib/storage/storage-path';
import { createServerSupabaseClient } from '@/shared/lib/supabase/server';

import 'server-only';

type UploadPdfFileOptions = {
  bucket?: string;
  directory?: string;
  file: File;
  filePath?: string;
  upsert?: boolean;
};

const DEFAULT_PDF_FILE_BUCKET = STORAGE_BUCKET.pdf;
const DEFAULT_PDF_FILE_DIRECTORY = '';

/**
 * Supabase Storage `pdf` 버킷에 PDF 파일을 업로드합니다.
 * 업로드 파일명은 UUID 기반으로 난수화되어 덮어쓰기 위험을 줄입니다.
 */
export const uploadPdfFile = async ({
  bucket = DEFAULT_PDF_FILE_BUCKET,
  directory = DEFAULT_PDF_FILE_DIRECTORY,
  file,
  filePath,
  upsert = false,
}: UploadPdfFileOptions): Promise<string> => {
  const supabase = await createServerSupabaseClient();
  const resolvedFilePath =
    filePath ?? createStoragePath(directory, createUniqueStorageFileName(file.name));

  const { error } = await supabase.storage.from(bucket).upload(resolvedFilePath, file, {
    contentType: file.type || 'application/pdf',
    upsert,
  });

  if (error) throw new Error(`[pdf-file] 파일 업로드 실패: ${error.message}`);

  return resolvedFilePath;
};
