import { isValidElement } from 'react';

import { createEditorSeed, getEditorDraftSeed } from '@/entities/editor/api/editor-read';
import { getTagOptionsByLocale } from '@/entities/tag/api/query-tags';
import { requireAdmin } from '@/shared/lib/auth/require-admin';

import AdminProjectNewRoute, { metadata } from './page';

vi.mock('@/shared/lib/auth/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/entities/editor/api/editor-read', () => ({
  createEditorSeed: vi.fn(),
  getEditorDraftSeed: vi.fn(),
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

describe('AdminProjectNewRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자 신규 project editor를 렌더링한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(getTagOptionsByLocale).mockResolvedValue([]);
    vi.mocked(createEditorSeed).mockReturnValue({
      contentType: 'project',
      initialDraftId: null,
      initialPublished: false,
      initialSavedAt: null,
      initialSettings: undefined,
      initialSlug: '',
      initialTags: [],
      initialTranslations: {
        en: { content: '', description: '', title: '' },
        fr: { content: '', description: '', title: '' },
        ja: { content: '', description: '', title: '' },
        ko: { content: '', description: '', title: '' },
      },
    });

    const element = await AdminProjectNewRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(createEditorSeed).toHaveBeenCalledWith('project');
    expect(typeof element.props.onDraftSave).toBe('function');
    expect(typeof element.props.onPublishSubmit).toBe('function');
    expect(element.props.contentType).toBe('project');
    expect(element.props.hideAppFrameFooter).toBe(true);
  });

  it('project 신규 작성도 draftId 이어쓰기를 지원한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(getTagOptionsByLocale).mockResolvedValue([]);
    vi.mocked(getEditorDraftSeed).mockResolvedValue({
      contentType: 'project',
      initialDraftId: 'draft-project-1',
      initialPublished: false,
      initialSavedAt: '2026-03-13T11:00:00.000Z',
      initialSettings: {
        allowComments: true,
        publishAt: null,
        slug: 'project-draft',
        thumbnailUrl: '',
        visibility: 'public',
      },
      initialSlug: 'project-draft',
      initialTags: [],
      initialTranslations: {
        en: { content: '', description: '', title: '' },
        fr: { content: '', description: '', title: '' },
        ja: { content: '', description: '', title: '' },
        ko: { content: '초안 프로젝트', description: '프로젝트 설명', title: '프로젝트 초안' },
      },
    });

    const element = await AdminProjectNewRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
      searchParams: Promise.resolve({
        draftId: 'draft-project-1',
      }),
    });

    expect(getEditorDraftSeed).toHaveBeenCalledWith({
      contentType: 'project',
      draftId: 'draft-project-1',
    });
    expect(element.props.initialDraftId).toBe('draft-project-1');
  });

  it('검색 엔진 색인을 비활성화한다', () => {
    expect(metadata.robots).toMatchObject({
      follow: false,
      index: false,
    });
  });
});
