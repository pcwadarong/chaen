const handleI18nRoutingMock = vi.fn();
const updateSessionMock = vi.fn();

vi.mock('next-intl/middleware', () => ({
  default: () => handleI18nRoutingMock,
}));

vi.mock('@/shared/lib/supabase/middleware', () => ({
  updateSession: updateSessionMock,
}));

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('next-intl 응답을 만든 뒤 Supabase 세션 갱신으로 전달한다', async () => {
    const request = { nextUrl: { pathname: '/ko/guest' } };
    const i18nResponse = { source: 'i18n-response' };
    const sessionResponse = { source: 'session-response' };

    handleI18nRoutingMock.mockReturnValue(i18nResponse);
    updateSessionMock.mockResolvedValue(sessionResponse);

    const { middleware } = await import('./middleware');
    const result = await middleware(request as never);

    expect(handleI18nRoutingMock).toHaveBeenCalledWith(request);
    expect(updateSessionMock).toHaveBeenCalledWith(request, i18nResponse);
    expect(result).toBe(sessionResponse);
  });

  it('정적 자산 경로를 matcher에서 제외한다', async () => {
    const { config } = await import('./middleware');

    expect(config.matcher).toEqual([
      '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ]);
  });
});
