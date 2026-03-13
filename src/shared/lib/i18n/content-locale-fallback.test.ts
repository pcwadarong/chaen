import {
  buildContentLocaleFallbackChain,
  pickPreferredLocaleValue,
} from './content-locale-fallback';

describe('buildContentLocaleFallbackChain', () => {
  it('요청 locale을 첫 후보로 두고 중복 없이 fallback 순서를 만든다', () => {
    expect(buildContentLocaleFallbackChain('fr')).toEqual(['fr', 'ko', 'en', 'ja']);
    expect(buildContentLocaleFallbackChain('ja')).toEqual(['ja', 'ko', 'en', 'fr']);
    expect(buildContentLocaleFallbackChain('ko')).toEqual(['ko', 'en', 'ja', 'fr']);
  });
});

describe('pickPreferredLocaleValue', () => {
  it('요청 locale이 없으면 fallback locale 순서로 첫 번째 번역을 고른다', () => {
    const result = pickPreferredLocaleValue({
      locales: ['ja', 'ko', 'en', 'fr'],
      resolveLocale: row => row.locale,
      rows: [
        { locale: 'en', value: 'english' },
        { locale: 'ko', value: 'korean' },
      ],
    });

    expect(result).toEqual({ locale: 'ko', value: 'korean' });
  });
});
