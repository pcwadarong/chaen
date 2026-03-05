/**
 * 도메인별 Supabase Storage 버킷 이름 집합입니다.
 */
export const STORAGE_BUCKET = {
  pdf: 'pdf',
  project: 'project',
  article: 'article',
} as const;

/**
 * 경로 세그먼트를 안전하게 합쳐 Storage 객체 경로를 생성합니다.
 */
export const createStoragePath = (...segments: string[]): string =>
  segments
    .map(segment => segment.trim().replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
