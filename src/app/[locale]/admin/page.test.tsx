import { redirect } from 'next/navigation';
import { isValidElement } from 'react';
import { vi } from 'vitest';

import AdminRoute, { metadata } from '@/app/[locale]/admin/page';
import { requireAdmin } from '@/shared/lib/auth/require-admin';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/shared/lib/auth/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/views/dashboard', () => ({
  DashboardPage: function DashboardPage() {
    return null;
  },
}));

describe('AdminRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자 세션이 있으면 관리자 페이지를 렌더링한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const element = await AdminRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('DashboardPage');
    expect(element.props.locale).toBe('ko');
  });

  it('관리자 세션이 없으면 로그인 페이지로 리다이렉트한다', async () => {
    vi.mocked(requireAdmin).mockImplementation(async () => redirect('/ko/admin/login'));

    await AdminRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(redirect).toHaveBeenCalledWith('/ko/admin/login');
  });

  it('관리자 페이지는 검색 엔진 색인을 비활성화한다', () => {
    expect(metadata.robots).toMatchObject({
      follow: false,
      index: false,
    });
  });
});
