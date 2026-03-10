import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

import { getPdfFileStorageConfig } from '../model/config';
import type { PdfFileKind } from '../model/types';

/**
 * PDF 파일 존재 여부 조회 옵션입니다.
 */
type GetPdfFileAvailabilityOptions = {
  kind?: PdfFileKind;
};

/**
 * PDF 파일 존재 여부 확인 시 사용할 Supabase 클라이언트를 선택합니다.
 */
const resolvePdfStorageClient = () =>
  createOptionalServiceRoleSupabaseClient() ?? createOptionalPublicServerSupabaseClient();

/**
 * Storage 파일 경로를 디렉터리와 파일명으로 분리합니다.
 */
const splitStorageFilePath = (filePath: string) => {
  const normalizedPath = filePath.trim().replace(/^\/+|\/+$/g, '');
  const segments = normalizedPath.split('/').filter(Boolean);
  const fileName = segments.pop() ?? '';

  return {
    directoryPath: segments.join('/'),
    fileName,
  };
};

/**
 * Supabase Storage에 PDF 파일이 실제로 존재하는지 확인합니다.
 */
export const getPdfFileAvailability = async ({
  kind = 'resume',
}: GetPdfFileAvailabilityOptions = {}): Promise<boolean> => {
  const storageConfig = getPdfFileStorageConfig(kind);
  const supabase = resolvePdfStorageClient();
  if (!supabase) return false;

  const { directoryPath, fileName } = splitStorageFilePath(storageConfig.filePath);
  const storage = supabase.storage.from(storageConfig.bucket);
  const { data, error } = await storage.list(directoryPath, {
    limit: 100,
    search: fileName,
  });

  if (error) return false;

  return (data ?? []).some(item => item.name === fileName);
};
