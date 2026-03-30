/* @vitest-environment jsdom */

import { redirect } from 'next/navigation';
import { isValidElement } from 'react';

import AdminAnalyticsRoute, { metadata } from '@/app/[locale]/admin/analytics/page';
import { requireAdmin } from '@/shared/lib/auth/require-admin';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/shared/lib/auth/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

describe('AdminAnalyticsRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자 분석 구형 경로는 메인 대시보드로 리다이렉트한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const element = await AdminAnalyticsRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(false);
    expect(redirect).toHaveBeenCalledWith('/ko/admin');
  });

  it('검색 엔진 색인을 비활성화한다', () => {
    expect(metadata.robots).toMatchObject({
      follow: false,
      index: false,
    });
  });
});
