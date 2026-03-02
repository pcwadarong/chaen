import { createOptionalPublicServerSupabaseClient } from '@/lib/supabase/public-server';

import 'server-only';

type PdfFileUrlAccessType = 'public' | 'signed';

type GetPdfFileUrlOptions = {
  accessType?: PdfFileUrlAccessType;
  bucket?: string;
  filePath?: string;
  signedUrlExpiresInSeconds?: number;
  downloadFileName?: string;
};

const DEFAULT_PDF_FILE_BUCKET = 'resumes';
const DEFAULT_PDF_FILE_PATH = process.env.NEXT_PUBLIC_PDF_FILE_PATH ?? 'ParkChaewon-Resume.pdf';
const DEFAULT_SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 10;

/**
 * Supabase Storage 객체가 존재하지 않는지 확인합니다.
 */
const isStorageObjectMissing = (errorMessage: string) =>
  /not found|no such object|does not exist/i.test(errorMessage);

/**
 * Supabase Storage에서 PDF 접근 URL(public/signed)을 생성합니다.
 */
export const getPdfFileUrl = async ({
  accessType = 'signed',
  bucket = DEFAULT_PDF_FILE_BUCKET,
  filePath = DEFAULT_PDF_FILE_PATH,
  signedUrlExpiresInSeconds = DEFAULT_SIGNED_URL_EXPIRES_IN_SECONDS,
  downloadFileName = DEFAULT_PDF_FILE_PATH,
}: GetPdfFileUrlOptions = {}): Promise<string | null> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return null;

  const storage = supabase.storage.from(bucket);

  if (accessType === 'public') {
    const { data } = storage.getPublicUrl(filePath);

    return data.publicUrl;
  }

  const { data, error } = await storage.createSignedUrl(filePath, signedUrlExpiresInSeconds, {
    download: downloadFileName,
  });

  if (error) {
    if (isStorageObjectMissing(error.message)) {
      return null;
    }

    throw new Error(`[pdf-file] signed URL 생성 실패: ${error.message}`);
  }

  return data.signedUrl;
};
