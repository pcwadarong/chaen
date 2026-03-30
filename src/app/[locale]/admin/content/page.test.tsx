/* @vitest-environment jsdom */

import { isValidElement } from 'react';

import AdminContentRoute, { metadata } from '@/app/[locale]/admin/content/page';
import { getAdminArticles } from '@/entities/article/api/list/get-admin-articles';
import { getAdminProjects } from '@/entities/project/api/list/get-admin-projects';
import { requireAdmin } from '@/shared/lib/auth/require-admin';

vi.mock('@/shared/lib/auth/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/entities/article/api/list/get-admin-articles', () => ({
  getAdminArticles: vi.fn(),
}));

vi.mock('@/entities/project/api/list/get-admin-projects', () => ({
  getAdminProjects: vi.fn(),
}));

vi.mock('@/features/manage-project/api/update-project-display-order', () => ({
  updateProjectDisplayOrderAction: vi.fn(),
}));

vi.mock('@/views/admin-content', () => ({
  AdminContentPage: function AdminContentPage() {
    return null;
  },
}));

describe('AdminContentRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자 콘텐츠 관리 페이지를 렌더링한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(getAdminArticles).mockResolvedValue([]);
    vi.mocked(getAdminProjects).mockResolvedValue([]);

    const element = await AdminContentRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(getAdminArticles).toHaveBeenCalledWith({ locale: 'ko' });
    expect(getAdminProjects).toHaveBeenCalledWith({ locale: 'ko' });
    expect(typeof element.props.onSaveProjectOrder).toBe('function');
  });

  it('검색 엔진 색인을 비활성화한다', () => {
    expect(metadata.robots).toMatchObject({
      follow: false,
      index: false,
    });
  });
});
