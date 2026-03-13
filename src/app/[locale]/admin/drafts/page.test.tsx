import { isValidElement } from 'react';

import { getEditorDraftSummaries } from '@/entities/editor/api/editor-read';
import { requireAdmin } from '@/shared/lib/auth/require-admin';

import AdminDraftsRoute, { metadata } from './page';

vi.mock('@/shared/lib/auth/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/entities/editor/api/editor-read', () => ({
  getEditorDraftSummaries: vi.fn(),
}));

vi.mock('@/views/editor-drafts', () => ({
  EditorDraftsPage: function EditorDraftsPage() {
    return null;
  },
}));

describe('AdminDraftsRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자 draft 목록을 렌더링한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(getEditorDraftSummaries).mockResolvedValue([
      {
        contentId: 'article-1',
        contentType: 'article',
        id: 'draft-1',
        title: '초안',
        updatedAt: '2026-03-12T10:00:00.000Z',
      },
    ]);

    const element = await AdminDraftsRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.props.items).toHaveLength(1);
  });

  it('검색 엔진 색인을 비활성화한다', () => {
    expect(metadata.robots).toMatchObject({
      follow: false,
      index: false,
    });
  });
});
