import { vi } from 'vitest';

import { getAllTags, getTagLabelMapBySlugs } from '@/entities/tag/api/query-tags';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';

import { getAdminEditorPageData } from './get-admin-editor-page-data';

vi.mock('@/shared/lib/auth/get-server-auth-state', () => ({
  getServerAuthState: vi.fn(),
}));

vi.mock('@/entities/tag/api/query-tags', () => ({
  getAllTags: vi.fn(),
  getTagLabelMapBySlugs: vi.fn(),
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
    vi.mocked(getTagLabelMapBySlugs).mockResolvedValue({
      data: new Map([
        ['accessibility', '접근성'],
        ['react', '리액트'],
      ]),
      schemaMissing: false,
    });

    await expect(getAdminEditorPageData({ locale: 'ko' })).resolves.toEqual({
      availableTags: [
        { id: 'tag-1', label: '접근성', slug: 'accessibility' },
        { id: 'tag-2', label: '리액트', slug: 'react' },
      ],
      redirectPath: null,
    });
  });

  it('번역 라벨이 없으면 slug를 그대로 label로 사용한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-user-id',
    });
    vi.mocked(getAllTags).mockResolvedValue({
      data: [{ id: 'tag-1', slug: 'accessibility' }],
      schemaMissing: false,
    });
    vi.mocked(getTagLabelMapBySlugs).mockResolvedValue({
      data: new Map(),
      schemaMissing: false,
    });

    await expect(getAdminEditorPageData({ locale: 'ko' })).resolves.toEqual({
      availableTags: [{ id: 'tag-1', label: 'accessibility', slug: 'accessibility' }],
      redirectPath: null,
    });
  });
});
