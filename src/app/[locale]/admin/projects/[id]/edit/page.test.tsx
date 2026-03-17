import { isValidElement } from 'react';

import AdminProjectEditRoute from '@/app/[locale]/admin/projects/[id]/edit/page';
import { getEditorSeed } from '@/entities/editor/api/editor-read';
import { getTagOptionsByLocale } from '@/entities/tag/api/query-tags';
import { requireAdmin } from '@/shared/lib/auth/require-admin';

vi.mock('@/shared/lib/auth/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/entities/editor/api/editor-read', () => ({
  getEditorSeed: vi.fn(),
}));

vi.mock('@/entities/editor/api/editor-actions', () => ({
  publishEditorContentAction: vi.fn(),
  saveEditorDraftAction: vi.fn(),
}));

vi.mock('@/entities/tag/api/query-tags', () => ({
  getTagOptionsByLocale: vi.fn(),
}));

vi.mock('@/views/editor', () => ({
  EditorPage: function EditorPage() {
    return null;
  },
}));

describe('AdminProjectEditRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('기존 project editor를 렌더링한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(getTagOptionsByLocale).mockResolvedValue([]);
    vi.mocked(getEditorSeed).mockResolvedValue({
      contentId: 'project-1',
      contentType: 'project',
      initialDraftId: null,
      initialPublished: false,
      initialSavedAt: null,
      initialSettings: {
        allowComments: true,
        publishAt: null,
        slug: 'project-slug',
        thumbnailUrl: '',
        visibility: 'private',
      },
      initialSlug: 'project-slug',
      initialTags: [],
      initialTranslations: {
        en: { content: '', description: '', title: '' },
        fr: { content: '', description: '', title: '' },
        ja: { content: '', description: '', title: '' },
        ko: { content: '프로젝트 본문', description: '프로젝트 설명', title: '프로젝트 제목' },
      },
    });

    const element = await AdminProjectEditRoute({
      params: Promise.resolve({
        id: 'project-1',
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.props.contentType).toBe('project');
    expect(element.props.contentId).toBe('project-1');
    expect(element.props.hideAppFrameFooter).toBe(true);
    expect(typeof element.props.onDraftSave).toBe('function');
    expect(typeof element.props.onPublishSubmit).toBe('function');
  });
});
