// @vitest-environment node

import getRequestConfig from '@/i18n/request';

vi.mock('next-intl/server', () => ({
  getRequestConfig: (callback: (...args: never[]) => unknown) => callback,
}));

/**
 * 요청 locale 값을 주면 next-intl request config 결과를 반환합니다.
 */
const readRequestConfig = (locale?: string) =>
  getRequestConfig({
    requestLocale: Promise.resolve(locale),
  } as never);

describe('request', () => {
  it('유효한 locale 요청이면 해당 locale과 메시지를 반환한다', async () => {
    const result = await readRequestConfig('ja');
    const messages = result.messages as { Navigation: { home: string } };

    expect(result.locale).toBe('ja');
    expect(messages.Navigation.home).toBe('ホーム');
  });

  it('locale 요청이 없으면 기본 locale과 메시지를 반환한다', async () => {
    const result = await readRequestConfig();
    const messages = result.messages as { Navigation: { home: string } };

    expect(result.locale).toBe('ko');
    expect(messages.Navigation.home).toBe('홈');
  });

  it('지원하지 않는 locale 요청이면 기본 locale로 되돌린다', async () => {
    const result = await readRequestConfig('jp');
    const messages = result.messages as { Navigation: { home: string } };

    expect(result.locale).toBe('ko');
    expect(messages.Navigation.home).toBe('홈');
  });
});
