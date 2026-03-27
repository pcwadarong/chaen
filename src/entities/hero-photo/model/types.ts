/**
 * Supabase Storage `photo` 버킷에 저장된 단일 사진 메타데이터입니다.
 */
export type PhotoFileItem = {
  createdAt: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  publicUrl: string;
  size: number;
};
