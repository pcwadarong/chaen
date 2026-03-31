// @vitest-environment node

import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';
import { createServerSupabaseClient } from '@/shared/lib/supabase/server';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';
import {
  resolveOptionalStorageReadSupabaseClient,
  resolveStorageWriteSupabaseClient,
} from '@/shared/lib/supabase/storage-client';

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

describe('storage-client resolver', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('읽기 resolver는 service role이 있으면 이를 우선 반환한다', () => {
    const serviceClient = { storage: { from: vi.fn() } };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(serviceClient as never);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue({
      storage: { from: vi.fn() },
    } as never);

    expect(resolveOptionalStorageReadSupabaseClient()).toBe(serviceClient);
  });

  it('읽기 resolver는 service role이 없으면 public server client로 폴백한다', () => {
    const publicClient = { storage: { from: vi.fn() } };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(null);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(publicClient as never);

    expect(resolveOptionalStorageReadSupabaseClient()).toBe(publicClient);
  });

  it('쓰기 resolver는 service role이 없으면 server client로 폴백한다', async () => {
    const serverClient = { storage: { from: vi.fn() } };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(null);
    vi.mocked(createServerSupabaseClient).mockResolvedValue(serverClient as never);

    await expect(resolveStorageWriteSupabaseClient()).resolves.toBe(serverClient);
  });
});
