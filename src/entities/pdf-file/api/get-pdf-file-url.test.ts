import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';
import { resolveOptionalStorageReadSupabaseClient } from '@/shared/lib/supabase/storage-client';

vi.mock('@/shared/lib/supabase/storage-client', () => ({
  resolveOptionalStorageReadSupabaseClient: vi.fn(),
}));

type MockStorage = {
  createSignedUrl: ReturnType<typeof vi.fn>;
  getPublicUrl: ReturnType<typeof vi.fn>;
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

describe('getPdfFileUrl', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('signed URL 조회 시 service role 클라이언트를 우선 사용한다', async () => {
    const serviceStorage = {
      createSignedUrl: vi.fn().mockResolvedValue({
        data: {
          signedUrl: 'https://example.com/signed-by-service.pdf',
        },
        error: null,
      }),
      getPublicUrl: vi.fn(),
    };
    const serviceSupabase = createSupabaseMock(serviceStorage);

    vi.mocked(resolveOptionalStorageReadSupabaseClient).mockReturnValue(
      serviceSupabase.supabase as never,
    );

    const result = await getPdfFileUrl({ kind: 'resume', accessType: 'signed' });

    expect(result).toBe('https://example.com/signed-by-service.pdf');
    expect(serviceSupabase.from).toHaveBeenCalledWith('resume');
    expect(serviceStorage.createSignedUrl).toHaveBeenCalledTimes(1);
  });

  it('읽기용 storage 클라이언트로 signed URL을 조회한다', async () => {
    const publicStorage = {
      createSignedUrl: vi.fn().mockResolvedValue({
        data: {
          signedUrl: 'https://example.com/signed-by-public.pdf',
        },
        error: null,
      }),
      getPublicUrl: vi.fn(),
    };

    const publicSupabase = createSupabaseMock(publicStorage);

    vi.mocked(resolveOptionalStorageReadSupabaseClient).mockReturnValue(
      publicSupabase.supabase as never,
    );

    const result = await getPdfFileUrl({ kind: 'resume', accessType: 'signed' });

    expect(result).toBe('https://example.com/signed-by-public.pdf');
    expect(publicSupabase.from).toHaveBeenCalledWith('resume');
  });

  it('storage object가 없으면 null을 반환한다', async () => {
    const publicStorage = {
      createSignedUrl: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Object not found',
        },
      }),
      getPublicUrl: vi.fn(),
    };

    const publicSupabase = createSupabaseMock(publicStorage);

    vi.mocked(resolveOptionalStorageReadSupabaseClient).mockReturnValue(
      publicSupabase.supabase as never,
    );

    const result = await getPdfFileUrl({ kind: 'resume', accessType: 'signed' });

    expect(result).toBeNull();
    expect(publicSupabase.from).toHaveBeenCalledWith('resume');
  });

  it('public accessType일 때 public URL을 반환한다', async () => {
    const publicStorage = {
      createSignedUrl: vi.fn(),
      getPublicUrl: vi.fn().mockReturnValue({
        data: {
          publicUrl: 'https://example.com/public.pdf',
        },
      }),
    };

    const publicSupabase = createSupabaseMock(publicStorage);

    vi.mocked(resolveOptionalStorageReadSupabaseClient).mockReturnValue(
      publicSupabase.supabase as never,
    );

    const result = await getPdfFileUrl({ kind: 'resume', accessType: 'public' });

    expect(result).toBe('https://example.com/public.pdf');
    expect(publicSupabase.from).toHaveBeenCalledWith('resume');
  });
});
