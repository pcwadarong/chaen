import { defaultLocale, locales } from '@/i18n/routing';

describe('routing', () => {
  it('exposes the supported locales', () => {
    expect(locales).toEqual(['ko', 'en', 'ja', 'fr']);
    expect(defaultLocale).toBe('ko');
  });
});
