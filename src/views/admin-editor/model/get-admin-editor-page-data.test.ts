import { vi } from 'vitest';

import { getAllTags } from '@/entities/tag/api/query-tags';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';

import { getAdminEditorPageData } from './get-admin-editor-page-data';

vi.mock('@/shared/lib/auth/get-server-auth-state', () => ({
  getServerAuthState: vi.fn(),
}));

vi.mock('@/entities/tag/api/query-tags', () => ({
  getAllTags: vi.fn(),
}));

describe('getAdminEditorPageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자가 아니면 로그인 경로로 리다이렉트한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });

    await expect(getAdminEditorPageData({ locale: 'ko' })).resolves.toEqual({
      availableTags: [],
      redirectPath: '/ko/admin/login',
    });
  });

  it('관리자면 전체 태그 slug 목록을 함께 반환한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-user-id',
    });
    vi.mocked(getAllTags).mockResolvedValue({
      data: [
        { id: 'tag-1', slug: 'accessibility' },
        { id: 'tag-2', slug: 'react' },
      ],
      schemaMissing: false,
    });

    await expect(getAdminEditorPageData({ locale: 'ko' })).resolves.toEqual({
      availableTags: [
        { id: 'tag-1', slug: 'accessibility' },
        { id: 'tag-2', slug: 'react' },
      ],
      redirectPath: null,
    });
  });
});
