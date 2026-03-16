import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
}));

type MockStorage = {
  createSignedUrl: ReturnType<typeof vi.fn>;
  getPublicUrl: ReturnType<typeof vi.fn>;
};

/**
 * Supabase storage mock 객체를 생성합니다.
 */
const createSupabaseMock = (storage: MockStorage) => ({
  storage: {
    from: vi.fn().mockReturnValue(storage),
  },
});

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
    const publicStorage = {
      createSignedUrl: vi.fn(),
      getPublicUrl: vi.fn(),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(
      createSupabaseMock(serviceStorage) as never,
    );
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(
      createSupabaseMock(publicStorage) as never,
    );

    const result = await getPdfFileUrl({ kind: 'resume', accessType: 'signed' });

    expect(result).toBe('https://example.com/signed-by-service.pdf');
    expect(serviceStorage.createSignedUrl).toHaveBeenCalledTimes(1);
    expect(publicStorage.createSignedUrl).not.toHaveBeenCalled();
  });

  it('service role이 없으면 public 서버 클라이언트로 signed URL을 조회한다', async () => {
    const publicStorage = {
      createSignedUrl: vi.fn().mockResolvedValue({
        data: {
          signedUrl: 'https://example.com/signed-by-public.pdf',
        },
        error: null,
      }),
      getPublicUrl: vi.fn(),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(null);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(
      createSupabaseMock(publicStorage) as never,
    );

    const result = await getPdfFileUrl({ kind: 'resume', accessType: 'signed' });

    expect(result).toBe('https://example.com/signed-by-public.pdf');
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

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(null);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(
      createSupabaseMock(publicStorage) as never,
    );

    const result = await getPdfFileUrl({ kind: 'resume', accessType: 'signed' });

    expect(result).toBeNull();
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

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(null);
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(
      createSupabaseMock(publicStorage) as never,
    );

    const result = await getPdfFileUrl({ kind: 'resume', accessType: 'public' });

    expect(result).toBe('https://example.com/public.pdf');
  });
});
