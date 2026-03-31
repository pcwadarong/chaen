// @vitest-environment node

import { unstable_cacheTag } from 'next/cache';
import { vi } from 'vitest';

import { getPdfFileAvailability } from '@/entities/pdf-file/api/get-pdf-file-availability';
import { resolveOptionalStorageReadSupabaseClient } from '@/shared/lib/supabase/storage-client';

vi.mock('next/cache', () => ({
  unstable_cacheTag: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/storage-client', () => ({
  resolveOptionalStorageReadSupabaseClient: vi.fn(),
}));

type MockStorage = {
  list: ReturnType<typeof vi.fn>;
};

/**
 * Supabase storage mock 객체를 생성합니다.
 */
const createSupabaseMock = (storage: MockStorage) => {
  const from = vi.fn().mockReturnValue(storage);

  return {
    from,
    supabase: {
      storage: {
        from,
      },
    },
  };
};

describe('getPdfFileAvailability', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('resume 버킷에 파일이 있을 때, getPdfFileAvailability는 true를 반환해야 한다', async () => {
    const publicStorage = {
      list: vi.fn().mockResolvedValue({
        data: [
          {
            name: 'ParkChaewon-Resume-en.pdf',
          },
        ],
        error: null,
      }),
    };

    const publicSupabase = createSupabaseMock(publicStorage);

    vi.mocked(resolveOptionalStorageReadSupabaseClient).mockReturnValue(
      publicSupabase.supabase as never,
    );

    await expect(getPdfFileAvailability({ kind: 'resume' })).resolves.toBe(true);
    expect(publicSupabase.from).toHaveBeenCalledWith('resume');
    expect(unstable_cacheTag).toHaveBeenCalledWith('pdf-files', 'pdf-file-availability:resume');
  });

  it('project 버킷에 파일이 없을 때, getPdfFileAvailability는 false를 반환해야 한다', async () => {
    const publicStorage = {
      list: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    const publicSupabase = createSupabaseMock(publicStorage);

    vi.mocked(resolveOptionalStorageReadSupabaseClient).mockReturnValue(
      publicSupabase.supabase as never,
    );

    await expect(getPdfFileAvailability({ kind: 'portfolio' })).resolves.toBe(false);
    expect(publicSupabase.from).toHaveBeenCalledWith('project');
    expect(unstable_cacheTag).toHaveBeenCalledWith('pdf-files', 'pdf-file-availability:portfolio');
  });
});
