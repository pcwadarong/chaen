import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createUniqueStorageFileName } from '@/shared/lib/storage/create-unique-storage-file-name';

import 'server-only';

type UploadPdfFileOptions = {
  bucket?: string;
  directory?: string;
  file: File;
};

const DEFAULT_PDF_FILE_BUCKET = 'resumes';
const DEFAULT_PDF_FILE_DIRECTORY = process.env.NEXT_PUBLIC_PDF_FILE_UPLOAD_DIRECTORY ?? 'uploads';

/**
 * Supabase Storage `resumes` 버킷에 PDF 파일을 업로드합니다.
 * 업로드 파일명은 UUID 기반으로 난수화되어 덮어쓰기 위험을 줄입니다.
 */
export const uploadPdfFile = async ({
  bucket = DEFAULT_PDF_FILE_BUCKET,
  directory = DEFAULT_PDF_FILE_DIRECTORY,
  file,
}: UploadPdfFileOptions): Promise<string> => {
  const supabase = await createServerSupabaseClient();
  const uniqueFileName = createUniqueStorageFileName(file.name);
  const filePath = `${directory}/${uniqueFileName}`;

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    contentType: file.type || 'application/pdf',
    upsert: false,
  });

  if (error) throw new Error(`[pdf-file] 파일 업로드 실패: ${error.message}`);

  return filePath;
};
