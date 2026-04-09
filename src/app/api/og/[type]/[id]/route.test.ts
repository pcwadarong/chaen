import { GET } from '@/app/api/og/[type]/[id]/route';

describe('api/og route', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://chaen.dev';
  });

  afterEach(() => {
    if (originalSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      return;
    }

    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('지원하는 타입이면 placeholder 이미지로 리다이렉트한다', async () => {
    const response = await GET(new Request('https://chaen.dev/api/og/article/hello'), {
      params: Promise.resolve({
        id: 'hello',
        type: 'article',
      }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://chaen.dev/thumbnail.png');
  });

  it('지원하지 않는 타입이면 404를 반환한다', async () => {
    const response = await GET(new Request('https://chaen.dev/api/og/guest/hello'), {
      params: Promise.resolve({
        id: 'hello',
        type: 'guest',
      }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'Not Found',
    });
  });
});
