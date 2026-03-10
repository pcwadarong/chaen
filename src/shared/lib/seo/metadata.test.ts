import { buildLocaleAlternates, buildLocalizedPathname } from '@/shared/lib/seo/metadata';

describe('seo metadata helpers', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://chaen.dev';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('locale prefix 경로를 생성한다', () => {
    expect(buildLocalizedPathname({ locale: 'en' })).toBe('/en');
    expect(buildLocalizedPathname({ locale: 'ja', pathname: '/articles' })).toBe('/ja/articles');
  });

  it('canonical과 hreflang alternate를 절대 URL로 생성한다', () => {
    expect(
      buildLocaleAlternates({
        canonicalLocale: 'en',
        pathnameByLocale: {
          ko: '/ko/articles/hello',
          en: '/en/articles/hello',
          ja: '/ja/articles/hello',
          fr: '/fr/articles/hello',
        },
      }),
    ).toEqual({
      canonical: 'https://chaen.dev/en/articles/hello',
      languages: {
        ko: 'https://chaen.dev/ko/articles/hello',
        en: 'https://chaen.dev/en/articles/hello',
        ja: 'https://chaen.dev/ja/articles/hello',
        fr: 'https://chaen.dev/fr/articles/hello',
        'x-default': 'https://chaen.dev/en/articles/hello',
      },
    });
  });
});
