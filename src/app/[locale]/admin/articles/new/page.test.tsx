import { isValidElement } from 'react';

import AdminArticleNewRoute, { metadata } from '@/app/[locale]/admin/articles/new/page';
import { createEditorSeed, getEditorDraftSeed } from '@/entities/editor/api/editor-read';
import { getTagOptionsByLocale } from '@/entities/tag/api/query-tags';
import { requireAdmin } from '@/shared/lib/auth/require-admin';

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

describe('AdminArticleNewRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자 신규 article editor를 렌더링한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(getTagOptionsByLocale).mockResolvedValue([
      { id: 'tag-1', label: '접근성', slug: 'a11y' },
    ]);
    vi.mocked(createEditorSeed).mockReturnValue({
      contentType: 'article',
      initialPublished: false,
      initialDraftId: null,
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

    const element = await AdminArticleNewRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(requireAdmin).toHaveBeenCalledWith({ locale: 'ko' });
    expect(getTagOptionsByLocale).toHaveBeenCalledWith('ko');
    expect(createEditorSeed).toHaveBeenCalledWith('article');
    expect(typeof element.props.onDraftSave).toBe('function');
    expect(typeof element.props.onPublishSubmit).toBe('function');
    expect(isValidElement(element)).toBe(true);
    expect(element.props.availableTags).toEqual([{ id: 'tag-1', label: '접근성', slug: 'a11y' }]);
    expect(element.props.contentType).toBe('article');
    expect(element.props.hideAppFrameFooter).toBe(true);
  });

  it('draftId가 있으면 draft seed를 우선 사용한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(getTagOptionsByLocale).mockResolvedValue([]);
    vi.mocked(getEditorDraftSeed).mockResolvedValue({
      contentType: 'article',
      initialDraftId: 'draft-1',
      initialPublished: false,
      initialSavedAt: '2026-03-13T10:00:00.000Z',
      initialSettings: {
        allowComments: true,
        publishAt: null,
        slug: 'draft-slug',
        thumbnailUrl: '',
        visibility: 'public',
      },
      initialSlug: 'draft-slug',
      initialTags: ['react'],
      initialTranslations: {
        en: { content: '', description: '', title: '' },
        fr: { content: '', description: '', title: '' },
        ja: { content: '', description: '', title: '' },
        ko: { content: '초안 본문', description: '초안 설명', title: '초안 제목' },
      },
    });

    const element = await AdminArticleNewRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
      searchParams: Promise.resolve({
        draftId: 'draft-1',
      }),
    });

    expect(getEditorDraftSeed).toHaveBeenCalledWith({
      contentType: 'article',
      draftId: 'draft-1',
    });
    expect(element.props.initialDraftId).toBe('draft-1');
  });

  it('검색 엔진 색인을 비활성화한다', () => {
    expect(metadata.robots).toMatchObject({
      follow: false,
      index: false,
    });
  });
});
