import { vi } from 'vitest';

import { GET } from '@/app/api/(files)/pdf/[kind]/route';
import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';

vi.mock('@/entities/pdf-file/api/get-pdf-file-url', () => ({
  getPdfFileUrl: vi.fn(),
}));

describe('api/pdf route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('지원하는 PDF 종류면 signed URL로 리다이렉트한다', async () => {
    vi.mocked(getPdfFileUrl).mockResolvedValue('https://example.com/resume-signed.pdf');

    const response = await GET(new Request('https://chaen.dev/api/pdf/resume'), {
      params: Promise.resolve({
        kind: 'resume',
      }),
    });

    expect(getPdfFileUrl).toHaveBeenCalledWith({
      accessType: 'signed',
      kind: 'resume',
    });
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://example.com/resume-signed.pdf');
  });

  it('지원하지 않는 PDF 종류면 404를 반환한다', async () => {
    const response = await GET(new Request('https://chaen.dev/api/pdf/unknown'), {
      params: Promise.resolve({
        kind: 'unknown',
      }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'Not Found',
    });
  });

  it('파일이 없으면 404를 반환한다', async () => {
    vi.mocked(getPdfFileUrl).mockResolvedValue(null);

    const response = await GET(new Request('https://chaen.dev/api/pdf/portfolio'), {
      params: Promise.resolve({
        kind: 'portfolio',
      }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'Not Found',
    });
  });
});
