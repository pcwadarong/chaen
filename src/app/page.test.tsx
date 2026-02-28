import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import RootPage from './page';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('RootPage', () => {
  const cookiesMock = vi.mocked(cookies);
  const redirectMock = vi.mocked(redirect);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * 루트 경로에서 사용하는 쿠키 스토어 모양을 간단히 흉내 냅니다.
   */
  const createCookieStore = (locale?: string) => ({
    get: vi.fn((name: string) =>
      name === 'NEXT_LOCALE' && locale ? { name, value: locale } : undefined,
    ),
  });

  it('유효한 locale 쿠키가 있으면 해당 경로로 리다이렉트한다', async () => {
    cookiesMock.mockResolvedValue(createCookieStore('ja') as never);

    await RootPage();

    expect(redirectMock).toHaveBeenCalledWith('/ja');
  });

  it('locale 쿠키가 없으면 기본 경로로 리다이렉트한다', async () => {
    cookiesMock.mockResolvedValue(createCookieStore() as never);

    await RootPage();

    expect(redirectMock).toHaveBeenCalledWith('/ko');
  });

  it('locale 쿠키가 잘못되면 기본 경로로 리다이렉트한다', async () => {
    cookiesMock.mockResolvedValue(createCookieStore('jp') as never);

    await RootPage();

    expect(redirectMock).toHaveBeenCalledWith('/ko');
  });
});
