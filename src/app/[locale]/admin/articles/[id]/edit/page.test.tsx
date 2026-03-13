import { notFound } from 'next/navigation';
import { isValidElement } from 'react';

import { getEditorSeed } from '@/entities/editor/api/editor-read';
import { getTagOptionsByLocale } from '@/entities/tag/api/query-tags';
import { requireAdmin } from '@/shared/lib/auth/require-admin';

import AdminArticleEditRoute from './page';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('notFound');
  }),
}));

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

describe('AdminArticleEditRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('기존 article editor를 렌더링한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(getTagOptionsByLocale).mockResolvedValue([
      { id: 'tag-1', label: '리액트', slug: 'react' },
    ]);
    vi.mocked(getEditorSeed).mockResolvedValue({
      contentId: 'article-1',
      contentType: 'article',
      initialDraftId: null,
      initialPublished: true,
      initialSavedAt: '2026-03-12T10:00:00.000Z',
      initialSettings: {
        allowComments: true,
        publishAt: null,
        slug: 'hello-world',
        thumbnailUrl: '',
        visibility: 'public',
      },
      initialSlug: 'hello-world',
      initialTags: ['react'],
      initialTranslations: {
        en: { content: '', title: '' },
        fr: { content: '', title: '' },
        ja: { content: '', title: '' },
        ko: { content: '본문', title: '제목' },
      },
    });

    const element = await AdminArticleEditRoute({
      params: Promise.resolve({
        id: 'article-1',
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(getEditorSeed).toHaveBeenCalledWith({
      contentId: 'article-1',
      contentType: 'article',
    });
    expect(element.props.contentId).toBe('article-1');
    expect(typeof element.props.onDraftSave).toBe('function');
    expect(typeof element.props.onPublishSubmit).toBe('function');
  });

  it('대상이 없으면 notFound를 호출한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(getTagOptionsByLocale).mockResolvedValue([]);
    vi.mocked(getEditorSeed).mockResolvedValue(null);

    await expect(
      AdminArticleEditRoute({
        params: Promise.resolve({
          id: 'missing',
          locale: 'ko',
        }),
      }),
    ).rejects.toThrow('notFound');

    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
