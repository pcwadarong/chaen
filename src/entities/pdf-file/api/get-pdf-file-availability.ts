import { unstable_cacheTag as cacheTag } from 'next/cache';

import {
  createPdfFileAvailabilityCacheTag,
  PDF_FILES_CACHE_TAG,
} from '@/entities/pdf-file/model/cache-tags';
import {
  getPdfFileAssetStorageConfig,
  getPdfFileStorageConfig,
} from '@/entities/pdf-file/model/config';
import type { PdfFileAssetKey, PdfFileKind } from '@/entities/pdf-file/model/types';
import { resolveOptionalStorageReadSupabaseClient } from '@/shared/lib/supabase/storage-client';

import 'server-only';

/**
 * PDF 파일 존재 여부 조회 옵션입니다.
 */
type GetPdfFileAvailabilityOptions = {
  assetKey?: PdfFileAssetKey;
  kind?: PdfFileKind;
};

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
 * Supabase Storage에 PDF 파일이 실제로 존재하는지 확인하는 cached read입니다.
 */
const readCachedPdfFileAvailability = async ({
  assetKey,
  kind,
}: GetPdfFileAvailabilityOptions): Promise<boolean> => {
  'use cache';

  const cacheKey = assetKey ?? kind ?? 'resume';

  cacheTag(PDF_FILES_CACHE_TAG, createPdfFileAvailabilityCacheTag(cacheKey));

  const storageConfig = assetKey
    ? getPdfFileAssetStorageConfig(assetKey)
    : getPdfFileStorageConfig(kind ?? 'resume');
  const supabase = resolveOptionalStorageReadSupabaseClient();
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

/**
 * Supabase Storage에 PDF 파일이 실제로 존재하는지 확인합니다.
 */
export const getPdfFileAvailability = async ({
  assetKey,
  kind = 'resume',
}: GetPdfFileAvailabilityOptions = {}): Promise<boolean> =>
  readCachedPdfFileAvailability({
    assetKey,
    kind,
  });
