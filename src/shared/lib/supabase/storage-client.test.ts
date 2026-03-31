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

  it('service role client가 있을 때, resolveOptionalStorageReadSupabaseClient는 해당 client를 우선 반환해야 한다', () => {
    const serviceClient = { storage: { from: vi.fn() } };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(serviceClient as never);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue({
      storage: { from: vi.fn() },
    } as never);

    expect(resolveOptionalStorageReadSupabaseClient()).toBe(serviceClient);
  });

  it('service role client가 없을 때, resolveOptionalStorageReadSupabaseClient는 public server client로 폴백해야 한다', () => {
    const publicClient = { storage: { from: vi.fn() } };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(null);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(publicClient as never);

    expect(resolveOptionalStorageReadSupabaseClient()).toBe(publicClient);
  });

  it('service role client가 없을 때, resolveStorageWriteSupabaseClient는 server client로 폴백해야 한다', async () => {
    const serverClient = { storage: { from: vi.fn() } };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(null);
    vi.mocked(createServerSupabaseClient).mockResolvedValue(serverClient as never);

    await expect(resolveStorageWriteSupabaseClient()).resolves.toBe(serverClient);
  });

  it('service role과 public server client가 모두 없을 때, resolveOptionalStorageReadSupabaseClient는 null을 반환해야 한다', () => {
    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(null);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(null);

    expect(resolveOptionalStorageReadSupabaseClient()).toBeNull();
  });
});
