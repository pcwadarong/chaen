import {
  buildContentLocaleFallbackChain,
  resolveFirstAvailableLocaleValue,
} from './content-locale-fallback';

describe('buildContentLocaleFallbackChain', () => {
  it('요청 locale을 첫 후보로 두고 중복 없이 fallback 순서를 만든다', () => {
    expect(buildContentLocaleFallbackChain('fr')).toEqual(['fr', 'ko', 'en', 'ja']);
    expect(buildContentLocaleFallbackChain('ja')).toEqual(['ja', 'ko', 'en', 'fr']);
    expect(buildContentLocaleFallbackChain('ko')).toEqual(['ko', 'en', 'ja', 'fr']);
  });
});

describe('resolveFirstAvailableLocaleValue', () => {
  it('locale 순서대로 조회해 첫 번째 유효 결과를 반환한다', async () => {
    const fetchByLocale = vi.fn(async (locale: string) =>
      locale === 'en' ? { items: ['value'], nextCursor: null } : { items: [], nextCursor: null },
    );

    const result = await resolveFirstAvailableLocaleValue({
      fetchByLocale,
      hasValue: value => value.items.length > 0,
      locales: ['fr', 'ko', 'en'],
    });

    expect(result).toEqual({
      items: ['value'],
      nextCursor: null,
    });
    expect(fetchByLocale).toHaveBeenNthCalledWith(1, 'fr');
    expect(fetchByLocale).toHaveBeenNthCalledWith(2, 'ko');
    expect(fetchByLocale).toHaveBeenNthCalledWith(3, 'en');
  });
});
