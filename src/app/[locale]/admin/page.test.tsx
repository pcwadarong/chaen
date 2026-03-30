import { redirect } from 'next/navigation';
import { isValidElement } from 'react';
import { vi } from 'vitest';

import AdminRoute, { metadata } from '@/app/[locale]/admin/page';
import { getAdminTopArticles } from '@/entities/article/api/list/get-admin-articles';
import { getAdminGoogleArticleTraffic } from '@/entities/article/api/list/get-admin-google-article-traffic';
import { getAdminPdfDownloadLogs } from '@/entities/pdf-file/api/get-admin-pdf-download-logs';
import { requireAdmin } from '@/shared/lib/auth/require-admin';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/shared/lib/auth/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/entities/article/api/list/get-admin-articles', () => ({
  getAdminTopArticles: vi.fn(),
}));

vi.mock('@/entities/pdf-file/api/get-admin-pdf-download-logs', () => ({
  getAdminPdfDownloadLogs: vi.fn(),
}));

vi.mock('@/entities/article/api/list/get-admin-google-article-traffic', () => ({
  getAdminGoogleArticleTraffic: vi.fn(),
}));

vi.mock('@/views/admin-analytics', () => ({
  AdminAnalyticsPage: function AdminAnalyticsPage() {
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
    vi.mocked(getAdminTopArticles).mockResolvedValue([]);
    vi.mocked(getAdminPdfDownloadLogs).mockResolvedValue([]);
    vi.mocked(getAdminGoogleArticleTraffic).mockResolvedValue({
      items: [],
      status: 'not_configured',
      totalClicks: 0,
    });

    const element = await AdminRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('AdminAnalyticsPage');
    expect(element.props.googleArticleTraffic).toMatchObject({
      status: 'not_configured',
    });
    expect(element.props.signOutRedirectPath).toBe('/ko/admin/login');
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
