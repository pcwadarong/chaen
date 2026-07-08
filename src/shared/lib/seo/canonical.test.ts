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

  it('요청 locale 번역이 없으면 실제 해석된 번역 locale을 canonical로 사용한다', () => {
    expect(
      resolveCanonicalLocale({
        requestedLocale: 'fr',
        resolvedLocale: 'ko',
      }),
    ).toBe('ko');
  });

  it('해석된 locale이 유효하지 않으면 요청 locale을 canonical로 사용한다', () => {
    expect(
      resolveCanonicalLocale({
        requestedLocale: 'fr',
        resolvedLocale: null,
      }),
    ).toBe('fr');
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
