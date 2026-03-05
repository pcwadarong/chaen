import { createOptionalPublicServerSupabaseClient } from '@/lib/supabase/public-server';

import { getPdfFileContent } from './get-pdf-file-content';

vi.mock('@/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

describe('getPdfFileContent', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('supabase client가 없으면 null을 반환한다', async () => {
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(null);

    const result = await getPdfFileContent({ locale: 'ko' });

    expect(result).toBeNull();
  });

  it('대상 locale에 데이터가 있으면 해당 데이터를 반환한다', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          title: 'Resume',
        },
        error: null,
      }),
    };
    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue(query),
    } as never);

    const result = await getPdfFileContent({ locale: 'en' });

    expect(result).toEqual({ title: 'Resume' });
    expect(query.eq).toHaveBeenCalledWith('locale', 'en');
  });

  it('대상 locale이 비어 있으면 ko locale로 fallback 조회한다', async () => {
    const targetLocaleQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };
    const fallbackLocaleQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          title: '이력서',
        },
        error: null,
      }),
    };

    const supabase = {
      from: vi.fn().mockReturnValueOnce(targetLocaleQuery).mockReturnValueOnce(fallbackLocaleQuery),
    };

    vi.mocked(createOptionalPublicServerSupabaseClient).mockReturnValue(supabase as never);

    const result = await getPdfFileContent({ locale: 'fr' });

    expect(result).toEqual({ title: '이력서' });
    expect(targetLocaleQuery.eq).toHaveBeenCalledWith('locale', 'fr');
    expect(fallbackLocaleQuery.eq).toHaveBeenCalledWith('locale', 'ko');
  });
});
