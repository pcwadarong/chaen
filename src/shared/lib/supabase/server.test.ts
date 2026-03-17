import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { createServerSupabaseClient } from '@/shared/lib/supabase/server';

const cookieStore = {
  getAll: vi.fn(),
  set: vi.fn(),
};

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({ auth: {} })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/config', () => ({
  getSupabaseEnv: () => ({
    supabaseAnonKey: 'anon-key',
    supabaseUrl: 'https://example.supabase.co',
  }),
}));

describe('createServerSupabaseClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieStore.getAll.mockReset();
    cookieStore.set.mockReset();
    cookieStore.getAll.mockReturnValue([{ name: 'sb-access-token', value: 'token' }]);
    vi.mocked(cookies).mockResolvedValue(cookieStore as never);
  });

  /**
   * createServerClient에 전달된 cookies 옵션을 읽어옵니다.
   */
  const getCookieOptions = () => {
    const options = vi.mocked(createServerClient).mock.calls[0]?.[2] as
      | {
          cookies: {
            getAll: () => unknown;
            setAll: (cookiesToSet: unknown[]) => void;
          };
        }
      | undefined;

    if (!options) {
      throw new Error('createServerClient options are missing');
    }

    return options;
  };

  it('현재 요청의 쿠키를 읽고 setAll을 통해 최신 세션 쿠키를 반영할 수 있다', async () => {
    await createServerSupabaseClient();

    expect(createServerClient).toHaveBeenCalledTimes(1);

    const options = getCookieOptions();
    expect(options.cookies.getAll()).toEqual([{ name: 'sb-access-token', value: 'token' }]);

    options.cookies.setAll([
      {
        name: 'sb-refresh-token',
        options: { path: '/' },
        value: 'refresh-token',
      },
    ]);

    expect(cookieStore.set).toHaveBeenCalledWith('sb-refresh-token', 'refresh-token', {
      path: '/',
    });
  });

  it('쿠키 쓰기가 제한된 환경에서도 예외를 전파하지 않는다', async () => {
    cookieStore.set.mockImplementation(() => {
      throw new Error('cookies are readonly');
    });

    await createServerSupabaseClient();

    const options = getCookieOptions();

    expect(() =>
      options.cookies.setAll([
        {
          name: 'sb-access-token',
          options: { path: '/' },
          value: 'next-token',
        },
      ]),
    ).not.toThrow();
  });
});
