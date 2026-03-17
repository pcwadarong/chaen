import { vi } from 'vitest';

import { GET } from '@/app/api/(files)/pdf/file/[assetKey]/route';
import { createPdfDownloadLog } from '@/entities/pdf-file/api/create-pdf-download-log';
import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';

vi.mock('@/entities/pdf-file/api/create-pdf-download-log', () => ({
  createPdfDownloadLog: vi.fn(),
}));

vi.mock('@/entities/pdf-file/api/get-pdf-file-url', () => ({
  getPdfFileUrl: vi.fn(),
}));

describe('api/pdf/file/[assetKey] route', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('지원하는 자산 키면 signed URL로 리다이렉트한다', async () => {
    vi.mocked(getPdfFileUrl).mockResolvedValue('https://example.com/resume-ko-signed.pdf');

    const response = await GET(new Request('https://chaen.dev/api/pdf/file/resume-ko'), {
      params: Promise.resolve({
        assetKey: 'resume-ko',
      }),
    });

    expect(getPdfFileUrl).toHaveBeenCalledWith({
      accessType: 'signed',
      assetKey: 'resume-ko',
    });
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://example.com/resume-ko-signed.pdf');
    expect(createPdfDownloadLog).not.toHaveBeenCalled();
  });

  it('지원하지 않는 자산 키면 404를 반환한다', async () => {
    const response = await GET(new Request('https://chaen.dev/api/pdf/file/unknown'), {
      params: Promise.resolve({
        assetKey: 'unknown',
      }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'Not Found',
    });
  });

  it('유효한 자산 키여도 signed URL이 없으면 404를 반환한다', async () => {
    vi.mocked(getPdfFileUrl).mockResolvedValue(null);

    const response = await GET(new Request('https://chaen.dev/api/pdf/file/resume-en'), {
      params: Promise.resolve({
        assetKey: 'resume-en',
      }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'Not Found',
    });
    expect(createPdfDownloadLog).not.toHaveBeenCalled();
  });

  it('공개 resume 다운로드 요청이면 로그를 저장한 뒤 리다이렉트한다', async () => {
    const expectedUrl = 'https://example.com/resume-ko-signed.pdf';
    vi.mocked(getPdfFileUrl).mockResolvedValue(expectedUrl);
    vi.mocked(createPdfDownloadLog).mockResolvedValue(true);

    const response = await GET(
      new Request('https://chaen.dev/api/pdf/file/resume-ko?source=resume-page', {
        headers: {
          referer: 'https://chaen.dev/ko/resume?utm_source=linkedin&utm_medium=social',
          'user-agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'x-forwarded-for': '203.0.113.10, 10.0.0.1',
          'x-vercel-ip-country': 'kr',
        },
      }),
      {
        params: Promise.resolve({
          assetKey: 'resume-ko',
        }),
      },
    );

    expect(createPdfDownloadLog).toHaveBeenCalledWith({
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
    });
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(expectedUrl);
  });

  it('로그 저장이 실패해도 다운로드 리다이렉트는 유지한다', async () => {
    vi.mocked(getPdfFileUrl).mockResolvedValue('https://example.com/portfolio-en-signed.pdf');
    vi.mocked(createPdfDownloadLog).mockRejectedValue(new Error('temporary failure'));

    const response = await GET(
      new Request('https://chaen.dev/api/pdf/file/portfolio-en?source=project-page', {
        headers: {
          referer: 'https://chaen.dev/ko/project?utm_source=github',
        },
      }),
      {
        params: Promise.resolve({
          assetKey: 'portfolio-en',
        }),
      },
    );

    expect(createPdfDownloadLog).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://example.com/portfolio-en-signed.pdf');
    await Promise.resolve();
    expect(consoleErrorSpy).toHaveBeenCalledWith('[api/pdf/file] createPdfDownloadLog crashed', {
      assetKey: 'portfolio-en',
      error: expect.any(Error),
      source: 'project-page',
    });
  });

  it('source와 asset kind가 맞지 않으면 로그를 남기지 않는다', async () => {
    vi.mocked(getPdfFileUrl).mockResolvedValue('https://example.com/resume-ko-signed.pdf');

    const response = await GET(
      new Request('https://chaen.dev/api/pdf/file/resume-ko?source=project-page'),
      {
        params: Promise.resolve({
          assetKey: 'resume-ko',
        }),
      },
    );

    expect(createPdfDownloadLog).not.toHaveBeenCalled();
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://example.com/resume-ko-signed.pdf');
  });

  it('로그 Promise가 끝나기 전에 redirect 응답을 반환한다', async () => {
    let resolveLog: ((value: boolean) => void) | undefined;
    vi.mocked(getPdfFileUrl).mockResolvedValue('https://example.com/resume-ko-signed.pdf');
    vi.mocked(createPdfDownloadLog).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveLog = resolve;
        }),
    );

    const response = await GET(
      new Request('https://chaen.dev/api/pdf/file/resume-ko?source=resume-page', {
        headers: {
          referer: 'https://chaen.dev/ko/resume?utm_source=linkedin',
        },
      }),
      {
        params: Promise.resolve({
          assetKey: 'resume-ko',
        }),
      },
    );

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://example.com/resume-ko-signed.pdf');
    expect(resolveLog).toBeTypeOf('function');

    if (resolveLog) {
      resolveLog(true);
    }
  });
});
