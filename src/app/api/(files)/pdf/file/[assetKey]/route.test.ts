import { vi } from 'vitest';

import { GET } from '@/app/api/(files)/pdf/file/[assetKey]/route';
import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';

vi.mock('@/entities/pdf-file/api/get-pdf-file-url', () => ({
  getPdfFileUrl: vi.fn(),
}));

describe('api/pdf/file/[assetKey] route', () => {
  afterEach(() => {
    vi.clearAllMocks();
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
});
