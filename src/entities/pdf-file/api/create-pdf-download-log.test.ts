import { vi } from 'vitest';

import { createPdfDownloadLog } from '@/entities/pdf-file/api/create-pdf-download-log';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
}));

describe('createPdfDownloadLog', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
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
        referer: 'https://chaen.dev',
        refererPath: '/ko/resume',
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
        referer: 'https://chaen.dev',
        refererPath: '/ko/project',
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
      referer: 'https://chaen.dev',
      referer_path: '/ko/project',
      source: 'project-page',
      utm_source: 'github',
    });
  });

  it('로그 저장 실패 시 false를 반환하고 에러를 기록한다', async () => {
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
    ).resolves.toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[pdf-file:resume-en] download log 저장 실패', {
      error: 'insert failed',
    });
  });
});
