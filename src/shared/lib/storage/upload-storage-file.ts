import type { StorageBucket } from '@/shared/lib/storage/storage-path';

import 'server-only';

type StorageUploadFileResult = {
  filePath: string;
  uploadData: unknown;
};

type StorageUploadFileResultWithPublicUrl = StorageUploadFileResult & {
  publicUrl: string;
};

type StorageUploadClient = {
  storage: {
    from: (bucketName: string) => {
      getPublicUrl: (filePath: string) => {
        data: {
          publicUrl: string;
        };
      };
      upload: (
        filePath: string,
        file: File,
        options: {
          contentType: string;
          upsert: boolean;
        },
      ) => Promise<{
        data?: unknown;
        error: {
          message: string;
        } | null;
      }>;
    };
  };
};

type UploadStorageFileOptions = {
  bucketName: StorageBucket;
  contentType: string;
  errorPrefix: string;
  errorSubject?: string;
  file: File;
  filePath: string;
  includePublicUrl?: boolean;
  supabase: StorageUploadClient;
  upsert?: boolean;
};

type UploadStorageFileOptionsWithPublicUrl = UploadStorageFileOptions & {
  includePublicUrl: true;
};

/**
 * 공통 Storage 업로드 플로우를 수행하고 필요 시 public URL까지 함께 반환합니다.
 *
 * @param options 업로드에 필요한 bucket, 경로, contentType, Supabase 클라이언트 정보입니다.
 * @returns 업로드된 filePath와 optional publicUrl, 원본 uploadData를 반환합니다.
 * @throws Storage 업로드가 실패하면 errorPrefix를 포함한 예외를 던집니다.
 */
export function uploadStorageFile(
  options: UploadStorageFileOptionsWithPublicUrl,
): Promise<StorageUploadFileResultWithPublicUrl>;

export function uploadStorageFile(
  options: UploadStorageFileOptions,
): Promise<StorageUploadFileResult>;

export async function uploadStorageFile({
  bucketName,
  contentType,
  errorPrefix,
  errorSubject = '파일',
  file,
  filePath,
  includePublicUrl = false,
  supabase,
  upsert = false,
}: UploadStorageFileOptions): Promise<
  StorageUploadFileResult | StorageUploadFileResultWithPublicUrl
> {
  const storage = supabase.storage.from(bucketName);
  const { data: uploadData, error } = await storage.upload(filePath, file, {
    contentType,
    upsert,
  });

  if (error) {
    throw new Error(`[${errorPrefix}] ${errorSubject} 업로드 실패: ${error.message}`);
  }

  if (!includePublicUrl) {
    return {
      filePath,
      uploadData,
    };
  }

  const { data } = storage.getPublicUrl(filePath);

  return {
    filePath,
    publicUrl: data.publicUrl,
    uploadData,
  };
}
