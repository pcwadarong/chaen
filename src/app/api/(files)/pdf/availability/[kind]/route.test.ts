import { vi } from 'vitest';

import { GET } from '@/app/api/(files)/pdf/availability/[kind]/route';
import { getPdfFileAvailability } from '@/entities/pdf-file/api/get-pdf-file-availability';

vi.mock('@/entities/pdf-file/api/get-pdf-file-availability', () => ({
  getPdfFileAvailability: vi.fn(),
}));

describe('api/pdf/availability route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('지원하는 kind면 준비 상태를 반환한다', async () => {
    vi.mocked(getPdfFileAvailability).mockResolvedValue(true);

    const response = await GET(new Request('https://chaen.dev/api/pdf/availability/resume'), {
      params: Promise.resolve({
        kind: 'resume',
      }),
    });

    expect(response.status).toBe(200);
    expect(getPdfFileAvailability).toHaveBeenCalledWith({
      kind: 'resume',
    });
    expect(await response.json()).toEqual({
      isPdfReady: true,
      kind: 'resume',
    });
  });

  it('지원하지 않는 kind면 404를 반환한다', async () => {
    const response = await GET(new Request('https://chaen.dev/api/pdf/availability/unknown'), {
      params: Promise.resolve({
        kind: 'unknown',
      }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'Not Found',
    });
  });

  it('availability 조회가 실패하면 500 에러 계약을 반환한다', async () => {
    vi.mocked(getPdfFileAvailability).mockRejectedValue(new Error('boom'));

    const response = await GET(new Request('https://chaen.dev/api/pdf/availability/resume'), {
      params: Promise.resolve({
        kind: 'resume',
      }),
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: 'Failed to load PDF availability',
    });
  });
});
