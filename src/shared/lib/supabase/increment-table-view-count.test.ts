import { vi } from 'vitest';

import { incrementTableViewCount } from '@/shared/lib/supabase/increment-table-view-count';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
}));

describe('incrementTableViewCount', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('articles 조회수는 atomic RPC로 증가시킨다', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: 12,
      error: null,
    });

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      rpc,
    } as never);

    const result = await incrementTableViewCount({
      id: 'frontend',
    });

    expect(result).toBe(12);
    expect(rpc).toHaveBeenCalledWith('increment_article_view_count', {
      target_id: 'frontend',
    });
  });

  it('rpc 결과가 비어 있으면 not found로 처리한다', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      rpc,
    } as never);

    await expect(
      incrementTableViewCount({
        id: 'missing',
      }),
    ).rejects.toThrow('articles item not found');
  });
});
