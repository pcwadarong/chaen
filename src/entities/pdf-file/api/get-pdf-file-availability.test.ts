import { vi } from 'vitest';

import { getPdfFileAvailability } from '@/entities/pdf-file/api/get-pdf-file-availability';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
}));

type MockStorage = {
  list: ReturnType<typeof vi.fn>;
};

/**
 * Supabase storage mock 객체를 생성합니다.
 */
const createSupabaseMock = (storage: MockStorage) => ({
  storage: {
    from: vi.fn().mockReturnValue(storage),
  },
});

describe('getPdfFileAvailability', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('storage에 파일이 있으면 true를 반환한다', async () => {
    const publicStorage = {
      list: vi.fn().mockResolvedValue({
        data: [
          {
            name: 'ParkChaewon-Resume.pdf',
          },
        ],
        error: null,
      }),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(null);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(
      createSupabaseMock(publicStorage) as never,
    );

    await expect(getPdfFileAvailability({ kind: 'resume' })).resolves.toBe(true);
  });

  it('storage에 파일이 없으면 false를 반환한다', async () => {
    const publicStorage = {
      list: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(null);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(
      createSupabaseMock(publicStorage) as never,
    );

    await expect(getPdfFileAvailability({ kind: 'portfolio' })).resolves.toBe(false);
  });
});
