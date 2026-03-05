import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

import { getPdfFileStorageConfig } from '../model/config';
import type { PdfFileKind } from '../model/types';

type PdfFileUrlAccessType = 'public' | 'signed';

type GetPdfFileUrlOptions = {
  accessType?: PdfFileUrlAccessType;
  kind?: PdfFileKind;
  bucket?: string;
  filePath?: string;
  signedUrlExpiresInSeconds?: number;
  downloadFileName?: string;
};

const DEFAULT_SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 10;

/**
 * signed URL 생성 시 사용할 Supabase 클라이언트를 선택합니다.
 * - 1순위: service role (private bucket/RLS 우회)
 * - 2순위: public anon
 */
const resolvePdfStorageClient = () =>
  createOptionalServiceRoleSupabaseClient() ?? createOptionalPublicServerSupabaseClient();

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
  kind = 'resume',
  bucket,
  filePath,
  signedUrlExpiresInSeconds = DEFAULT_SIGNED_URL_EXPIRES_IN_SECONDS,
  downloadFileName,
}: GetPdfFileUrlOptions = {}): Promise<string | null> => {
  const storageConfig = getPdfFileStorageConfig(kind);
  const resolvedBucket = bucket ?? storageConfig.bucket;
  const resolvedFilePath = filePath ?? storageConfig.filePath;
  const resolvedDownloadFileName = downloadFileName ?? storageConfig.downloadFileName;
  const supabase = resolvePdfStorageClient();
  if (!supabase) return null;

  const storage = supabase.storage.from(resolvedBucket);

  if (accessType === 'public') {
    const { data } = storage.getPublicUrl(resolvedFilePath);
    return data.publicUrl;
  }

  const { data, error } = await storage.createSignedUrl(
    resolvedFilePath,
    signedUrlExpiresInSeconds,
    {
      download: resolvedDownloadFileName,
    },
  );

  if (error) {
    if (isStorageObjectMissing(error.message)) return null;
    throw new Error(`[pdf-file:${kind}] signed URL 생성 실패: ${error.message}`);
  }

  return data.signedUrl;
};
