import { PHOTO_STORAGE_BUCKET } from '@/entities/hero-photo/model/config';
import type { PhotoFileItem } from '@/entities/hero-photo/model/types';
import { createServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

const PHOTO_LIST_PAGE_SIZE = 1000;

type StoragePhotoListItem = {
  created_at?: string;
  metadata?: {
    mimetype?: string;
    size?: number;
  };
  name: string;
};

/**
 * Storage 목록 응답을 관리자 사진 카드에서 바로 사용할 수 있는 형태로 정리합니다.
 */
const mapStoragePhotoItem = (file: StoragePhotoListItem, publicUrl: string): PhotoFileItem => ({
  createdAt: file.created_at ?? '',
  fileName: file.name,
  filePath: file.name,
  mimeType: file.metadata?.mimetype ?? 'application/octet-stream',
  publicUrl,
  size: typeof file.metadata?.size === 'number' ? file.metadata.size : 0,
});

/**
 * `photo` 버킷의 모든 사진을 업로드 시각 순서대로 조회합니다.
 */
export const listPhotoFiles = async (): Promise<PhotoFileItem[]> => {
  const supabase = createServiceRoleSupabaseClient();
  const storage = supabase.storage.from(PHOTO_STORAGE_BUCKET);
  const items: PhotoFileItem[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await storage.list('', {
      limit: PHOTO_LIST_PAGE_SIZE,
      offset,
      sortBy: {
        column: 'created_at',
        order: 'asc',
      },
    });

    if (error) {
      throw new Error(`[photo-file] 사진 목록 조회 실패: ${error.message}`);
    }

    const pageItems = (data ?? []).map(file => {
      const { data: publicUrlData } = storage.getPublicUrl(file.name);

      return mapStoragePhotoItem(file, publicUrlData.publicUrl);
    });

    items.push(...pageItems);

    if (pageItems.length === 0 || pageItems.length < PHOTO_LIST_PAGE_SIZE) {
      break;
    }

    offset += PHOTO_LIST_PAGE_SIZE;
  }

  return items;
};
