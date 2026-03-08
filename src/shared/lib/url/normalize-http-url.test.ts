import { normalizeHttpUrl } from './normalize-http-url';

describe('normalizeHttpUrl', () => {
  it('http/https URL만 허용한다', () => {
    expect(normalizeHttpUrl('https://example.com/hello')).toBe('https://example.com/hello');
    expect(normalizeHttpUrl('http://example.com')).toBe('http://example.com/');
  });

  it('위험한 스킴은 제거한다', () => {
    expect(normalizeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeHttpUrl('data:text/html,hello')).toBeNull();
    expect(normalizeHttpUrl('mailto:test@example.com')).toBeNull();
  });

  it('잘못된 URL이나 빈 값은 null을 반환한다', () => {
    expect(normalizeHttpUrl('')).toBeNull();
    expect(normalizeHttpUrl('   ')).toBeNull();
    expect(normalizeHttpUrl('not-a-url')).toBeNull();
    expect(normalizeHttpUrl(null)).toBeNull();
  });
});
