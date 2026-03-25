import { buildPathnameByLocale, resolveCanonicalLocale } from '@/shared/lib/seo/canonical';

describe('seo canonical helpers', () => {
  it('요청 locale 번역이 있으면 해당 locale 경로를 canonical로 사용한다', () => {
    expect(
      resolveCanonicalLocale({
        requestedLocale: 'ko',
        resolvedLocale: 'ko',
      }),
    ).toBe('ko');
  });

  it('요청 locale 번역이 없으면 en을 canonical로 사용한다', () => {
    expect(
      resolveCanonicalLocale({
        requestedLocale: 'fr',
        resolvedLocale: 'ko',
      }),
    ).toBe('en');
  });

  it('locale별 경로 맵을 생성한다', () => {
    expect(buildPathnameByLocale(locale => `/${locale}/articles/hello`)).toEqual({
      ko: '/ko/articles/hello',
      en: '/en/articles/hello',
      ja: '/ja/articles/hello',
      fr: '/fr/articles/hello',
    });
  });
});
