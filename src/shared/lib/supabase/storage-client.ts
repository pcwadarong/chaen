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
 * service role이 있으면 우선 사용하고, 없으면 public server client로 폴백합니다.
 */
export const resolveOptionalStorageReadSupabaseClient =
  (): OptionalStorageReadSupabaseClient | null =>
    createOptionalServiceRoleSupabaseClient() ?? createOptionalPublicServerSupabaseClient();

/**
 * 관리자 Storage 쓰기 작업에 사용할 Supabase 클라이언트를 선택합니다.
 * service role이 있으면 우선 사용하고, 없으면 서버 세션 기반 client로 폴백합니다.
 */
export const resolveStorageWriteSupabaseClient = async (): Promise<StorageWriteSupabaseClient> =>
  createOptionalServiceRoleSupabaseClient() ?? (await createServerSupabaseClient());
