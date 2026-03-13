import { redirect } from 'next/navigation';
import { isValidElement } from 'react';
import { vi } from 'vitest';

import { getLoginPageData } from '@/views/auth';

import AdminLoginRoute, { metadata } from './page';

const { adminLoginPageMock, redirectError } = vi.hoisted(() => ({
  adminLoginPageMock: vi.fn(() => null),
  redirectError: new Error('NEXT_REDIRECT'),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw redirectError;
  }),
}));

vi.mock('@/views/auth', () => ({
  getLoginPageData: vi.fn(),
  LoginPage: adminLoginPageMock,
}));

describe('AdminLoginRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자 세션이 없으면 로그인 페이지를 렌더링한다', async () => {
    vi.mocked(getLoginPageData).mockResolvedValue({
      redirectPath: null,
    });

    const element = await AdminLoginRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type).toBe(adminLoginPageMock);
    expect(getLoginPageData).toHaveBeenCalledWith({ locale: 'ko' });
  });

  it('관리자 세션이면 즉시 리다이렉트한다', async () => {
    vi.mocked(getLoginPageData).mockResolvedValue({
      redirectPath: '/ko/admin',
    });

    await expect(
      AdminLoginRoute({
        params: Promise.resolve({
          locale: 'ko',
        }),
      }),
    ).rejects.toThrow(redirectError);

    expect(redirect).toHaveBeenCalledWith('/ko/admin');
    expect(adminLoginPageMock).not.toHaveBeenCalled();
  });

  it('관리자 로그인 페이지는 검색 엔진 색인을 비활성화한다', () => {
    expect(metadata.robots).toMatchObject({
      follow: false,
      index: false,
    });
  });
});
