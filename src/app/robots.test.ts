import robots from './robots';

describe('robots', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://chaen.dev';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('locale prefix를 포함한 관리자 라우트를 disallow에 포함한다', () => {
    expect(robots()).toMatchObject({
      rules: {
        allow: '/',
        disallow: expect.arrayContaining([
          '/admin',
          '/admin/login',
          '/ko/admin',
          '/ko/admin/login',
          '/en/admin',
          '/ja/admin',
          '/fr/admin',
        ]),
      },
      sitemap: 'https://chaen.dev/sitemap.xml',
    });
  });
});
