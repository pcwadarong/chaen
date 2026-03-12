import { isValidSlugFormat, normalizeSlugInput, slugifyText } from './slug';

describe('slug utils', () => {
  it('제목 문자열을 URL 친화적인 slug로 변환한다', () => {
    expect(slugifyText('WEB ACCessibility Optimization')).toBe('web-accessibility-optimization');
    expect(slugifyText('Optimize Web Accessibility!')).toBe('optimize-web-accessibility');
  });

  it('slug 입력값에서 허용되지 않는 문자를 제거한다', () => {
    expect(normalizeSlugInput('Hello World!!__next.js')).toBe('hello-worldnextjs');
    expect(normalizeSlugInput('---Already-valid---')).toBe('---already-valid---');
    expect(normalizeSlugInput('-')).toBe('-');
    expect(normalizeSlugInput(' hello world ')).toBe('hello-world');
  });

  it('최종 slug 형식은 하이픈이 단어 사이에만 올 때만 유효하다', () => {
    expect(isValidSlugFormat('hello-world')).toBe(true);
    expect(isValidSlugFormat('-hello')).toBe(false);
    expect(isValidSlugFormat('hello-')).toBe(false);
    expect(isValidSlugFormat('-')).toBe(false);
  });
});
