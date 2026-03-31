import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';
import { createServerSupabaseClient } from '@/shared/lib/supabase/server';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

export type OptionalStorageReadSupabaseClient =
  | NonNullable<ReturnType<typeof createOptionalServiceRoleSupabaseClient>>
  | NonNullable<ReturnType<typeof createOptionalPublicServerSupabaseClient>>;

export type StorageWriteSupabaseClient =
  | NonNullable<ReturnType<typeof createOptionalServiceRoleSupabaseClient>>
  | Awaited<ReturnType<typeof createServerSupabaseClient>>;

/**
 * Storage 읽기 작업에 사용할 Supabase 클라이언트를 선택합니다.
 *
 * service role client를 우선 사용하고, 없으면 public server client로 폴백합니다.
 * 둘 다 없으면 null을 반환합니다.
 * 읽기 전용 조회, 공개 URL 계산, 캐시 태그 기반 데이터 조회처럼
 * request context 없이도 동작해야 하는 shared 읽기 경로에서 사용합니다.
 */
export const resolveOptionalStorageReadSupabaseClient =
  (): OptionalStorageReadSupabaseClient | null =>
    createOptionalServiceRoleSupabaseClient() ?? createOptionalPublicServerSupabaseClient();

/**
 * Storage 쓰기 작업에 사용할 Supabase 클라이언트를 선택합니다.
 *
 * service role client를 우선 사용하고, 없으면 request context가 필요한
 * server session client로 폴백합니다. null을 반환하지 않지만 server session이
 * 준비되지 않으면 내부적으로 예외가 발생할 수 있습니다.
 * 관리자 업로드나 서버 사이드 mutation처럼 쓰기 권한이 필요한 경로에서 사용합니다.
 */
export const resolveStorageWriteSupabaseClient = async (): Promise<StorageWriteSupabaseClient> =>
  createOptionalServiceRoleSupabaseClient() ?? (await createServerSupabaseClient());
