import { getEditorDraftSummaries } from '@/entities/editor/api/editor-read';
import { requireAdmin } from '@/shared/lib/auth/require-admin';

import { GET } from './route';

vi.mock('@/shared/lib/auth/require-admin', () => ({
  AdminAuthorizationError: class AdminAuthorizationError extends Error {},
  requireAdmin: vi.fn(),
}));

vi.mock('@/entities/editor/api/editor-read', () => ({
  getEditorDraftSummaries: vi.fn(),
}));

describe('api/editor/drafts route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('draft 목록을 반환한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(getEditorDraftSummaries).mockResolvedValue([
      {
        contentId: null,
        contentType: 'article',
        id: 'draft-1',
        title: '초안',
        updatedAt: '2026-03-12T10:00:00.000Z',
      },
      {
        contentId: null,
        contentType: 'resume',
        id: 'resume-draft-1',
        title: '이력서 초안',
        updatedAt: '2026-03-13T09:00:00.000Z',
      },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[1]).toMatchObject({
      contentType: 'resume',
      id: 'resume-draft-1',
      title: '이력서 초안',
    });
  });
});
