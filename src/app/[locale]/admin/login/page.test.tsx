import { redirect } from 'next/navigation';
import { isValidElement } from 'react';
import { vi } from 'vitest';

import { getAdminLoginPageData } from '@/views/admin-login';

import AdminLoginRoute from './page';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/views/admin-login', () => ({
  AdminLoginPage: function AdminLoginPage() {
    return null;
  },
  getAdminLoginPageData: vi.fn(),
}));

describe('AdminLoginRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자 세션이 없으면 로그인 페이지를 렌더링한다', async () => {
    vi.mocked(getAdminLoginPageData).mockResolvedValue({
      redirectPath: null,
    });

    const element = await AdminLoginRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('AdminLoginPage');
    expect(getAdminLoginPageData).toHaveBeenCalledWith({ locale: 'ko' });
  });

  it('관리자 세션이면 즉시 리다이렉트한다', async () => {
    vi.mocked(getAdminLoginPageData).mockResolvedValue({
      redirectPath: '/ko/admin',
    });

    await AdminLoginRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(redirect).toHaveBeenCalledWith('/ko/admin');
  });
});
