/**
 * 도메인별 Supabase Storage 버킷 이름 집합입니다.
 */
export const STORAGE_BUCKET = {
  photo: 'photo',
  resume: 'resume',
  project: 'project',
  article: 'article',
} as const;

export type StorageBucket = (typeof STORAGE_BUCKET)[keyof typeof STORAGE_BUCKET];

/**
 * editor 콘텐츠가 사용하는 Storage 디렉터리 이름 집합입니다.
 */
export const STORAGE_DIRECTORY = {
  attachments: 'attachments',
  images: 'images',
  pdf: 'pdf',
  thumbnails: 'thumbnails',
} as const;

export type StorageDirectory = (typeof STORAGE_DIRECTORY)[keyof typeof STORAGE_DIRECTORY];

export const CONTENT_STORAGE_DIRECTORIES = [
  STORAGE_DIRECTORY.attachments,
  STORAGE_DIRECTORY.images,
  STORAGE_DIRECTORY.pdf,
  STORAGE_DIRECTORY.thumbnails,
] as const;

export type ContentStorageDirectory = (typeof CONTENT_STORAGE_DIRECTORIES)[number];

export const CONTENT_STORAGE_BUCKETS = [
  STORAGE_BUCKET.article,
  STORAGE_BUCKET.project,
  STORAGE_BUCKET.resume,
] as const;

export type ContentStorageBucket = (typeof CONTENT_STORAGE_BUCKETS)[number];
export type EditorContentStorageBucket = ContentStorageBucket;

/**
 * editor 본문 자산 버킷인지 판별합니다.
 */
export const isEditorContentStorageBucket = (value: string): value is EditorContentStorageBucket =>
  CONTENT_STORAGE_BUCKETS.includes(value as EditorContentStorageBucket);

/**
 * editor contentType에 대응하는 storage 버킷을 반환합니다.
 */
export const resolveEditorContentStorageBucket = (
  contentType: EditorContentStorageBucket,
): EditorContentStorageBucket => contentType;

/**
 * 콘텐츠 버킷 내부 디렉터리 규칙에 맞는 storage object path를 생성합니다.
 */
export const createContentStoragePath = (
  directory: ContentStorageDirectory,
  fileName: string,
): string => createStoragePath(directory, fileName);

/**
 * 경로 세그먼트를 안전하게 합쳐 Storage 객체 경로를 생성합니다.
 */
export const createStoragePath = (...segments: string[]): string =>
  segments
    .map(segment => segment.trim().replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
