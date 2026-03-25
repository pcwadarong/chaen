import { defaultLocale, isValidLocale, localeCookieName, locales } from '@/i18n/routing';

describe('routing', () => {
  it('지원하는 locale 목록과 기본 locale을 노출한다', () => {
    expect(locales).toEqual(['ko', 'en', 'ja', 'fr']);
    expect(defaultLocale).toBe('ko');
  });

  it('지원하는 locale만 유효하다고 판별한다', () => {
    expect(isValidLocale('ko')).toBe(true);
    expect(isValidLocale('en')).toBe(true);
    expect(isValidLocale('ja')).toBe(true);
    expect(isValidLocale('fr')).toBe(true);
    expect(isValidLocale('jp')).toBe(false);
    expect(isValidLocale('de')).toBe(false);
  });

  it('locale 쿠키 이름으로 NEXT_LOCALE을 사용한다', () => {
    expect(localeCookieName).toBe('NEXT_LOCALE');
  });
});
