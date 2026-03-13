import ogs from 'open-graph-scraper';

import { GET } from './route';

vi.mock('open-graph-scraper', () => ({
  default: vi.fn(),
}));

describe('api/og metadata route', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('유효하지 않은 URL이면 400을 반환한다', async () => {
    const response = await GET(new Request('https://chaen.dev/api/og?url=javascript:alert(1)'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid url',
    });
  });

  it('OG 결과를 카드 응답 형태로 정규화한다', async () => {
    vi.mocked(ogs).mockResolvedValue({
      html: '<html />',
      ogObject: {
        favicon: '/favicon.ico',
        ogDescription: 'Repository description',
        ogImage: [{ url: '/preview.png' }],
        ogSiteName: 'GitHub',
        ogTitle: 'openai/openai',
      },
      response: {
        body: '<html />',
      },
    } as never);

    const response = await GET(
      new Request('https://chaen.dev/api/og?url=https%3A%2F%2Fgithub.com%2Fopenai%2Fopenai'),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=86400');
    expect(body).toEqual({
      description: 'Repository description',
      favicon: 'https://github.com/favicon.ico',
      image: 'https://github.com/preview.png',
      siteName: 'GitHub',
      title: 'openai/openai',
      url: 'https://github.com/openai/openai',
    });
  });

  it('OG 태그가 없어도 HTML 메타 fallback 응답을 반환한다', async () => {
    vi.mocked(ogs).mockRejectedValue(new Error('no og tags'));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        text: async () =>
          '<html><head><title>NAVER</title><meta name="description" content="네이버 메인"><link rel="icon" href="/favicon.ico"></head></html>',
      }),
    );

    const response = await GET(
      new Request('https://chaen.dev/api/og?url=https%3A%2F%2Fexample.com%2Fdocs'),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      description: '네이버 메인',
      favicon: 'https://example.com/favicon.ico',
      image: null,
      siteName: 'example.com',
      title: 'NAVER',
      url: 'https://example.com/docs',
    });
  });
});
