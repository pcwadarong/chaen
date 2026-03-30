/* @vitest-environment node */

import { getAdminPdfDownloadLogs } from '@/entities/pdf-file/api/get-admin-pdf-download-logs';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
}));

describe('getAdminPdfDownloadLogs', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('limit이 주어졌을 때, getAdminPdfDownloadLogs는 최근 PDF 로그를 최신순으로 제한 조회해야 한다', async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'log-1',
          asset_key: 'resume-ko',
          kind: 'resume',
          file_locale: 'ko',
          source: 'resume-page',
          utm_source: 'linkedin',
          referer: 'https://chaen.dev',
          referer_path: '/ko/resume',
          device_type: 'desktop',
          country_code: 'KR',
          ip: null,
          created_at: '2026-03-30T10:00:00.000Z',
        },
      ],
      error: null,
    });
    const order = vi.fn().mockReturnValue({ limit });

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn(() => ({
        order,
        select: vi.fn().mockReturnThis(),
      })),
    } as never);

    const result = await getAdminPdfDownloadLogs({ limit: 20 });

    expect(order).toHaveBeenCalledWith('created_at', {
      ascending: false,
    });
    expect(limit).toHaveBeenCalledWith(20);
    expect(result).toHaveLength(1);
    expect(result[0]?.utm_source).toBe('linkedin');
  });

  it('서비스 롤 클라이언트를 만들 수 없을 때, getAdminPdfDownloadLogs는 빈 배열을 반환해야 한다', async () => {
    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(null);

    await expect(getAdminPdfDownloadLogs({ limit: 10 })).resolves.toEqual([]);
  });

  it('데이터베이스 조회가 실패할 때, getAdminPdfDownloadLogs는 예외를 던져야 한다', async () => {
    const limit = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('some'),
    });
    const order = vi.fn().mockReturnValue({ limit });

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn(() => ({
        order,
        select: vi.fn().mockReturnThis(),
      })),
    } as never);

    await expect(getAdminPdfDownloadLogs({ limit: 10 })).rejects.toThrow(
      '[admin-pdf-logs] 로그 조회 실패: some',
    );
  });
});
