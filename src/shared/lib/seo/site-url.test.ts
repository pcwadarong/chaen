import { buildAbsoluteSiteUrl, getSiteUrl, normalizeSiteUrl } from '@/shared/lib/seo/site-url';

describe('site-url', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('사이트 URL 마지막 슬래시를 제거한다', () => {
    expect(normalizeSiteUrl('https://chaen.dev///')).toBe('https://chaen.dev');
  });

  it('환경 변수에서 사이트 URL을 읽는다', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://chaen.dev/';

    expect(getSiteUrl()).toBe('https://chaen.dev');
  });

  it('절대 URL을 조합한다', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://chaen.dev';

    expect(buildAbsoluteSiteUrl('/en/articles/hello')).toBe('https://chaen.dev/en/articles/hello');
  });

  it('사이트 URL 환경 변수가 없으면 예외를 던진다', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;

    expect(() => getSiteUrl()).toThrow('Missing environment variable: NEXT_PUBLIC_SITE_URL');
  });
});
