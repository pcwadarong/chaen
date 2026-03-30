import { createUniqueStorageFileName } from '@/shared/lib/storage/create-unique-storage-file-name';
import { createStoragePath, STORAGE_BUCKET } from '@/shared/lib/storage/storage-path';
import { createServerSupabaseClient } from '@/shared/lib/supabase/server';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

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
 * 관리자 PDF 업로드에 사용할 Supabase Storage 클라이언트를 결정합니다.
 *
 * PDF 자산은 관리자 전용 고정 경로 업로드이므로 service role이 있으면 이를 우선 사용합니다.
 * service role이 없는 개발 환경에서는 기존 세션 기반 server client로 폴백합니다.
 *
 * @returns PDF 업로드에 사용할 Supabase 클라이언트
 */
const resolvePdfUploadSupabaseClient = async () =>
  createOptionalServiceRoleSupabaseClient() ?? (await createServerSupabaseClient());

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
  const supabase = await resolvePdfUploadSupabaseClient();
  const resolvedFilePath =
    filePath ?? createStoragePath(directory, createUniqueStorageFileName(file.name));

  const { error } = await supabase.storage.from(bucket).upload(resolvedFilePath, file, {
    contentType: file.type || 'application/pdf',
    upsert,
  });

  if (error) throw new Error(`[pdf-file] 파일 업로드 실패: ${error.message}`);

  return resolvedFilePath;
};
