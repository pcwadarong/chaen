import { getEditorSeed } from '@/entities/editor/api/editor-read';
import { requireAdmin } from '@/shared/lib/auth/require-admin';

import { GET } from './route';

vi.mock('@/shared/lib/auth/require-admin', () => ({
  AdminAuthorizationError: class AdminAuthorizationError extends Error {},
  requireAdmin: vi.fn(),
}));

vi.mock('@/entities/editor/api/editor-read', () => ({
  getEditorSeed: vi.fn(),
}));

describe('api/editor/projects/[id] route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('project editor seed를 반환한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(getEditorSeed).mockResolvedValue({
      contentId: 'project-1',
      contentType: 'project',
      initialPublished: false,
      initialSavedAt: null,
      initialSettings: undefined,
      initialSlug: '',
      initialTags: [],
      initialTranslations: {
        en: { content: '', title: '' },
        fr: { content: '', title: '' },
        ja: { content: '', title: '' },
        ko: { content: '', title: '' },
      },
    });

    const response = await GET(new Request('https://chaen.dev/api/editor/projects/project-1'), {
      params: Promise.resolve({ id: 'project-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.contentType).toBe('project');
  });
});
