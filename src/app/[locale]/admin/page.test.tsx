import { redirect } from 'next/navigation';
import { isValidElement } from 'react';
import { vi } from 'vitest';

import { getAdminPageData } from '@/views/admin';

import AdminRoute from './page';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/views/admin', () => ({
  AdminPage: function AdminPage() {
    return null;
  },
  getAdminPageData: vi.fn(),
}));

describe('AdminRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자 세션이 있으면 관리자 페이지를 렌더링한다', async () => {
    vi.mocked(getAdminPageData).mockResolvedValue({
      redirectPath: null,
    });

    const element = await AdminRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('AdminPage');
    expect(element.props.locale).toBe('ko');
  });

  it('관리자 세션이 없으면 로그인 페이지로 리다이렉트한다', async () => {
    vi.mocked(getAdminPageData).mockResolvedValue({
      redirectPath: '/ko/admin/login',
    });

    await AdminRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(redirect).toHaveBeenCalledWith('/ko/admin/login');
  });
});
