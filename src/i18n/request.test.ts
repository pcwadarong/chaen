vi.mock('next-intl/server', () => ({
  getRequestConfig: (callback: (...args: never[]) => unknown) => callback,
}));

describe('request', () => {
  it('유효한 locale 요청이면 해당 locale과 메시지를 반환한다', async () => {
    const { default: getRequestConfig } = await import('./request');

    const result = await getRequestConfig({
      requestLocale: Promise.resolve('ja'),
    } as never);
    const messages = result.messages as { Resume: { title: string } };

    expect(result.locale).toBe('ja');
    expect(messages.Resume.title).toBe('こんにちは、パク・チェウォンです。');
  });

  it('locale 요청이 없으면 기본 locale과 메시지를 반환한다', async () => {
    const { default: getRequestConfig } = await import('./request');

    const result = await getRequestConfig({
      requestLocale: Promise.resolve(undefined),
    } as never);
    const messages = result.messages as { Resume: { title: string } };

    expect(result.locale).toBe('ko');
    expect(messages.Resume.title).toBe('안녕하세요 박채원입니다.');
  });

  it('지원하지 않는 locale 요청이면 기본 locale로 되돌린다', async () => {
    const { default: getRequestConfig } = await import('./request');

    const result = await getRequestConfig({
      requestLocale: Promise.resolve('jp'),
    } as never);
    const messages = result.messages as { Resume: { title: string } };

    expect(result.locale).toBe('ko');
    expect(messages.Resume.title).toBe('안녕하세요 박채원입니다.');
  });
});
