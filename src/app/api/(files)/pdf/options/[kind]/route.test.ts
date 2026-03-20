import { vi } from 'vitest';

import { GET } from '@/app/api/(files)/pdf/options/[kind]/route';
import { getPdfFileDownloadOptions } from '@/entities/pdf-file/api/get-pdf-file-download-options';

vi.mock('@/entities/pdf-file/api/get-pdf-file-download-options', () => ({
  getPdfFileDownloadOptions: vi.fn(),
}));

describe('api/pdf/options route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('지원하는 kind면 다운로드 옵션 목록을 반환한다', async () => {
    vi.mocked(getPdfFileDownloadOptions).mockResolvedValue([
      {
        assetKey: 'resume-ko',
        fileName: 'ParkChaewon-Resume-ko.pdf',
        href: '/api/pdf/file/resume-ko?source=resume-page',
        locale: 'ko',
      },
    ]);

    const response = await GET(
      new Request('https://chaen.dev/api/pdf/options/resume?source=resume-page'),
      {
        params: Promise.resolve({
          kind: 'resume',
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(getPdfFileDownloadOptions).toHaveBeenCalledWith('resume', {
      source: 'resume-page',
    });
    expect(await response.json()).toEqual([
      {
        assetKey: 'resume-ko',
        fileName: 'ParkChaewon-Resume-ko.pdf',
        href: '/api/pdf/file/resume-ko?source=resume-page',
        locale: 'ko',
      },
    ]);
  });

  it('source query가 없어도 다운로드 옵션을 반환한다', async () => {
    vi.mocked(getPdfFileDownloadOptions).mockResolvedValue([]);

    const response = await GET(new Request('https://chaen.dev/api/pdf/options/resume'), {
      params: Promise.resolve({
        kind: 'resume',
      }),
    });

    expect(response.status).toBe(200);
    expect(getPdfFileDownloadOptions).toHaveBeenCalledWith('resume', {
      source: undefined,
    });
    expect(await response.json()).toEqual([]);
  });

  it('지원하지 않는 kind면 404를 반환한다', async () => {
    const response = await GET(new Request('https://chaen.dev/api/pdf/options/unknown'), {
      params: Promise.resolve({
        kind: 'unknown',
      }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'Not Found',
    });
  });

  it('지원하지 않는 source면 400을 반환한다', async () => {
    const response = await GET(
      new Request('https://chaen.dev/api/pdf/options/resume?source=invalid-source'),
      {
        params: Promise.resolve({
          kind: 'resume',
        }),
      },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid PDF download source',
    });
  });
});
