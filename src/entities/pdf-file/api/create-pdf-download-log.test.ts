import { vi } from 'vitest';

import { createPdfDownloadLog } from '@/entities/pdf-file/api/create-pdf-download-log';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
}));

describe('createPdfDownloadLog', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('service role client가 없으면 false를 반환한다', async () => {
    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(null);

    await expect(
      createPdfDownloadLog({
        assetKey: 'resume-ko',
        countryCode: 'KR',
        deviceType: 'mobile',
        fileLocale: 'ko',
        ip: '203.0.113.10',
        kind: 'resume',
        referer: 'https://chaen.dev/ko/resume?utm_source=linkedin',
        refererPath: '/ko/resume?utm_source=linkedin',
        source: 'resume-page',
        utmSource: 'linkedin',
      }),
    ).resolves.toBe(false);
  });

  it('로그 저장이 성공하면 true를 반환한다', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ insert }));
    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({ from } as never);

    await expect(
      createPdfDownloadLog({
        assetKey: 'portfolio-en',
        countryCode: 'US',
        deviceType: 'desktop',
        fileLocale: 'en',
        ip: '198.51.100.7',
        kind: 'portfolio',
        referer: 'https://chaen.dev/ko/project?utm_source=github',
        refererPath: '/ko/project?utm_source=github',
        source: 'project-page',
        utmSource: 'github',
      }),
    ).resolves.toBe(true);

    expect(from).toHaveBeenCalledWith('pdf_download_logs');
    expect(insert).toHaveBeenCalledWith({
      asset_key: 'portfolio-en',
      country_code: 'US',
      device_type: 'desktop',
      file_locale: 'en',
      ip: '198.51.100.7',
      kind: 'portfolio',
      referer: 'https://chaen.dev/ko/project?utm_source=github',
      referer_path: '/ko/project?utm_source=github',
      source: 'project-page',
      utm_source: 'github',
    });
  });

  it('로그 저장 실패 시 예외를 던진다', async () => {
    const insert = vi.fn().mockResolvedValue({
      error: {
        message: 'insert failed',
      },
    });
    const from = vi.fn(() => ({ insert }));
    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({ from } as never);

    await expect(
      createPdfDownloadLog({
        assetKey: 'resume-en',
        countryCode: null,
        deviceType: 'unknown',
        fileLocale: 'en',
        ip: null,
        kind: 'resume',
        referer: null,
        refererPath: null,
        source: 'resume-page',
        utmSource: null,
      }),
    ).rejects.toThrow('[pdf-file:resume-en] download log 저장 실패: insert failed');
  });
});
