import { normalizeSlugInput, slugifyText } from './slug';

describe('slug utils', () => {
  it('제목 문자열을 URL 친화적인 slug로 변환한다', () => {
    expect(slugifyText('WEB ACCessibility Optimization')).toBe('web-accessibility-optimization');
    expect(slugifyText('Optimize Web Accessibility!')).toBe('optimize-web-accessibility');
  });

  it('slug 입력값에서 허용되지 않는 문자를 제거한다', () => {
    expect(normalizeSlugInput('Hello World!!__next.js')).toBe('hello-worldnextjs');
    expect(normalizeSlugInput('---Already-valid---')).toBe('already-valid');
  });
});
