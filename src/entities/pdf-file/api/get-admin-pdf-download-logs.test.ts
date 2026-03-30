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

  it('최근 PDF 다운로드 로그를 최신순으로 제한 조회한다', async () => {
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
});
