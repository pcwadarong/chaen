import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import { checkSlugDuplicate } from './check-slug-duplicate';
import {
  deleteEditorDraftAction,
  publishEditorContentAction,
  saveEditorDraftAction,
} from './editor-actions';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/shared/lib/auth/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
}));

vi.mock('./check-slug-duplicate', () => ({
  checkSlugDuplicate: vi.fn(),
}));

describe('editor-actions', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('draft 저장 시 publish settings를 drafts payload에 함께 저장한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const tagsQuery = {
      from: vi.fn(),
      in: vi.fn().mockResolvedValue({
        data: [{ id: 'tag-id-1', slug: 'react' }],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const draftsInsertQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'draft-1',
          updated_at: '2026-03-13T10:00:00.000Z',
        },
        error: null,
      }),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi
        .fn()
        .mockImplementation((table: string) => (table === 'tags' ? tagsQuery : draftsInsertQuery)),
    } as never);

    await saveEditorDraftAction({
      contentType: 'article',
      locale: 'ko',
      settings: {
        allowComments: false,
        publishAt: '2026-03-20T01:00:00.000Z',
        slug: 'draft-slug',
        thumbnailUrl: 'https://example.com/thumb.png',
        visibility: 'private',
      },
      state: {
        dirty: true,
        slug: '',
        tags: ['react'],
        translations: {
          en: { content: '', description: '', title: '' },
          fr: { content: '', description: '', title: '' },
          ja: { content: '', description: '', title: '' },
          ko: { content: '본문', description: '설명', title: '제목' },
        },
      },
    });

    expect(draftsInsertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        allow_comments: false,
        publish_at: '2026-03-20T01:00:00.000Z',
        slug: 'draft-slug',
        tags: ['tag-id-1'],
        thumbnail_url: 'https://example.com/thumb.png',
        visibility: 'private',
      }),
    );
  });

  it('article draft를 공용 drafts 테이블에서 삭제한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const draftsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi
        .fn()
        .mockImplementation((column: string) =>
          column === 'content_type' ? Promise.resolve({ error: null }) : draftsDeleteQuery,
        ),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue(draftsDeleteQuery),
    } as never);

    await deleteEditorDraftAction({
      contentType: 'article',
      draftId: 'draft-1',
      locale: 'ko',
    });

    expect(draftsDeleteQuery.eq).toHaveBeenNthCalledWith(1, 'id', 'draft-1');
    expect(draftsDeleteQuery.eq).toHaveBeenNthCalledWith(2, 'content_type', 'article');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/admin/drafts');
  });

  it('article 지금 발행 후에는 공개 slug 경로로 이동한다', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-14T06:15:00.000Z'));

    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(checkSlugDuplicate).mockResolvedValue({
      data: { duplicate: false },
      schemaMissing: false,
    });

    const articlesUpdateQuery = {
      eq: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
    };
    const translationsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    const translationsInsertQuery = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    const articleTagsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    const draftsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi
        .fn()
        .mockImplementation((column: string) =>
          column === 'id' ? Promise.resolve({ error: null }) : draftsDeleteQuery,
        ),
    };
    const articleTranslationsFromCalls: string[] = [];

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'articles') return articlesUpdateQuery;
        if (table === 'article_translations') {
          articleTranslationsFromCalls.push(table);
          return articleTranslationsFromCalls.length === 1
            ? translationsDeleteQuery
            : translationsInsertQuery;
        }
        if (table === 'article_tags') return articleTagsDeleteQuery;
        if (table === 'drafts') return draftsDeleteQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
    } as never);

    await publishEditorContentAction({
      contentId: 'article-1',
      contentType: 'article',
      draftId: 'draft-1',
      editorState: {
        dirty: true,
        slug: '',
        tags: [],
        translations: {
          en: { content: '', description: '', title: '' },
          fr: { content: '', description: '', title: '' },
          ja: { content: '', description: '', title: '' },
          ko: { content: '본문', description: '설명', title: '제목' },
        },
      },
      locale: 'ko',
      settings: {
        allowComments: true,
        publishAt: null,
        slug: 'published-article',
        thumbnailUrl: '',
        visibility: 'public',
      },
    });

    expect(articlesUpdateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        publish_at: '2026-03-14T06:15:00.000Z',
      }),
    );
    expect(redirect).toHaveBeenCalledWith('/ko/articles/published-article');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/articles');
    expect(revalidatePath).toHaveBeenCalledWith('/en/articles');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/articles/published-article');
    expect(revalidatePath).toHaveBeenCalledWith('/en/articles/published-article');
  });

  it('article 예약 발행 후에는 목록 경로로 이동한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(checkSlugDuplicate).mockResolvedValue({
      data: { duplicate: false },
      schemaMissing: false,
    });

    const articlesUpdateQuery = {
      eq: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
    };
    const translationsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    const translationsInsertQuery = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    const articleTagsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    const draftsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi
        .fn()
        .mockImplementation((column: string) =>
          column === 'id' ? Promise.resolve({ error: null }) : draftsDeleteQuery,
        ),
    };
    const articleTranslationsFromCalls: string[] = [];

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'articles') return articlesUpdateQuery;
        if (table === 'article_translations') {
          articleTranslationsFromCalls.push(table);
          return articleTranslationsFromCalls.length === 1
            ? translationsDeleteQuery
            : translationsInsertQuery;
        }
        if (table === 'article_tags') return articleTagsDeleteQuery;
        if (table === 'drafts') return draftsDeleteQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
    } as never);

    await publishEditorContentAction({
      contentId: 'article-1',
      contentType: 'article',
      draftId: 'draft-2',
      editorState: {
        dirty: true,
        slug: '',
        tags: [],
        translations: {
          en: { content: '', description: '', title: '' },
          fr: { content: '', description: '', title: '' },
          ja: { content: '', description: '', title: '' },
          ko: { content: '본문', description: '설명', title: '제목' },
        },
      },
      locale: 'ko',
      settings: {
        allowComments: true,
        publishAt: '2026-03-20T01:00:00.000Z',
        slug: 'scheduled-article',
        thumbnailUrl: '',
        visibility: 'public',
      },
    });

    expect(redirect).toHaveBeenCalledWith('/ko/articles');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/articles');
    expect(revalidatePath).toHaveBeenCalledWith('/ja/articles');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/articles/scheduled-article');
  });

  it('project 예약 발행 후에는 프로젝트 목록 경로로 이동한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(checkSlugDuplicate).mockResolvedValue({
      data: { duplicate: false },
      schemaMissing: false,
    });

    const projectsUpdateQuery = {
      eq: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
    };
    const translationsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    const translationsInsertQuery = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    const projectTagsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    const draftsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi
        .fn()
        .mockImplementation((column: string) =>
          column === 'id' ? Promise.resolve({ error: null }) : draftsDeleteQuery,
        ),
    };
    const projectTranslationsFromCalls: string[] = [];

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'projects') return projectsUpdateQuery;
        if (table === 'project_translations') {
          projectTranslationsFromCalls.push(table);
          return projectTranslationsFromCalls.length === 1
            ? translationsDeleteQuery
            : translationsInsertQuery;
        }
        if (table === 'project_tags') return projectTagsDeleteQuery;
        if (table === 'drafts') return draftsDeleteQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
    } as never);

    await publishEditorContentAction({
      contentId: 'project-1',
      contentType: 'project',
      draftId: 'draft-3',
      editorState: {
        dirty: true,
        slug: '',
        tags: [],
        translations: {
          en: { content: '', description: '', title: '' },
          fr: { content: '', description: '', title: '' },
          ja: { content: '', description: '', title: '' },
          ko: { content: '본문', description: '설명', title: '제목' },
        },
      },
      locale: 'ko',
      settings: {
        allowComments: true,
        publishAt: '2026-03-20T01:00:00.000Z',
        slug: 'scheduled-project',
        thumbnailUrl: '',
        visibility: 'public',
      },
    });

    expect(redirect).toHaveBeenCalledWith('/ko/project');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/project');
    expect(revalidatePath).toHaveBeenCalledWith('/fr/project');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/project/scheduled-project');
    expect(revalidatePath).toHaveBeenCalledWith('/ko');
    expect(revalidatePath).toHaveBeenCalledWith('/en');
  });

  it('resume draft를 전용 resume_drafts 테이블에서 삭제한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const resumeDraftsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue(resumeDraftsDeleteQuery),
    } as never);

    await deleteEditorDraftAction({
      contentType: 'resume',
      draftId: 'resume-draft-1',
      locale: 'ko',
    });

    expect(resumeDraftsDeleteQuery.eq).toHaveBeenCalledWith('id', 'resume-draft-1');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/admin/resume/edit');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/admin/drafts');
  });

  it('다른 cache helper에는 영향 없이 draft 관련 경로만 갱신한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const draftsDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi
        .fn()
        .mockImplementation((column: string) =>
          column === 'content_type' ? Promise.resolve({ error: null }) : draftsDeleteQuery,
        ),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue(draftsDeleteQuery),
    } as never);

    await deleteEditorDraftAction({
      contentType: 'project',
      draftId: 'draft-2',
      locale: 'ko',
    });

    expect(revalidateTag).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});
