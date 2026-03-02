import { createPublicServerSupabaseClient } from '@/lib/supabase/public-server';

import 'server-only';

type ResumeUrlAccessType = 'public' | 'signed';

type GetResumeUrlOptions = {
  accessType?: ResumeUrlAccessType;
  bucket?: string;
  filePath?: string;
  signedUrlExpiresInSeconds?: number;
  downloadFileName?: string;
};

const DEFAULT_RESUME_BUCKET = 'resumes';
const DEFAULT_RESUME_FILE_PATH =
  process.env.NEXT_PUBLIC_RESUME_FILE_PATH ?? 'ParkChaewon-Resume.pdf';
const DEFAULT_SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 10;

/**
 * Supabase Storage 객체가 존재하지 않는지 확인합니다.
 */
const isStorageObjectMissing = (errorMessage: string) =>
  /not found|no such object|does not exist/i.test(errorMessage);

/**
 * Supabase Storage에서 이력서 PDF 접근 URL(public/signed)을 생성합니다.
 */
export const getResumeUrl = async ({
  accessType = 'signed',
  bucket = DEFAULT_RESUME_BUCKET,
  filePath = DEFAULT_RESUME_FILE_PATH,
  signedUrlExpiresInSeconds = DEFAULT_SIGNED_URL_EXPIRES_IN_SECONDS,
  downloadFileName = DEFAULT_RESUME_FILE_PATH,
}: GetResumeUrlOptions = {}): Promise<string | null> => {
  const supabase = createPublicServerSupabaseClient();
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

    throw new Error(`[resume] signed URL 생성 실패: ${error.message}`);
  }

  return data.signedUrl;
};

/**
 * Supabase Storage `resumes` 버킷 세팅 가이드(SQL 예시)
 *
 * ```sql
 * insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
 * values ('resumes', 'resumes', false, 10485760, array['application/pdf'])
 * on conflict (id) do update
 * set public = excluded.public,
 *     file_size_limit = excluded.file_size_limit,
 *     allowed_mime_types = excluded.allowed_mime_types;
 *
 * -- signed URL 발급을 위해 anon/authenticated 읽기 허용 (RLS 정책)
 * create policy "resumes_select_for_download"
 * on storage.objects
 * for select
 * to anon, authenticated
 * using (bucket_id = 'resumes');
 *
 * -- 업로드는 관리자/서버에서만 수행하는 것을 권장
 * ```
 */
