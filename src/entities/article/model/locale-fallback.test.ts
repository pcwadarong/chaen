import { buildArticleLocaleFallbackChain } from './locale-fallback';

describe('buildArticleLocaleFallbackChain', () => {
  it('요청 locale을 첫 후보로 두고 중복 없이 fallback 순서를 만든다', () => {
    expect(buildArticleLocaleFallbackChain('fr')).toEqual(['fr', 'ko', 'en', 'ja']);
    expect(buildArticleLocaleFallbackChain('ja')).toEqual(['ja', 'ko', 'en', 'fr']);
    expect(buildArticleLocaleFallbackChain('ko')).toEqual(['ko', 'en', 'ja', 'fr']);
  });
});
