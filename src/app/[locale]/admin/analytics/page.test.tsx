/* @vitest-environment node */

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

  it('유효한 관리자 인증 상태에서, AdminAnalyticsRoute는 /ko/admin으로 리다이렉트해야 한다', async () => {
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

  it('어떤 조건에서도, metadata는 robots.index와 robots.follow를 false로 제공해야 한다', () => {
    expect(metadata.robots).toMatchObject({
      follow: false,
      index: false,
    });
  });
});
