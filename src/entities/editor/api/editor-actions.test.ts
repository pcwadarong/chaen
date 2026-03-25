import { revalidatePath, revalidateTag } from 'next/cache';

import { checkSlugDuplicate } from '@/entities/editor/api/check-slug-duplicate';
import {
  deleteEditorDraftAction,
  publishEditorContentAction,
  saveEditorDraftAction,
} from '@/entities/editor/api/editor-actions';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
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
    vi.useRealTimers();
    vi.restoreAllMocks();
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
        githubUrl: '',
        publishAt: '2026-03-20T01:00:00.000Z',
        slug: 'draft-slug',
        thumbnailUrl: 'https://example.com/thumb.png',
        visibility: 'private',
        websiteUrl: '',
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

  it('이미 등록된 article draft 저장 시 publish_at은 기존 등록 시각을 유지한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const articleReadQuery = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          publish_at: '2026-03-10T09:00:00.000Z',
          visibility: 'public',
        },
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const draftsUpdateQuery = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'draft-1',
          updated_at: '2026-03-14T10:00:00.000Z',
        },
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
    };
    const tagsQuery = {
      in: vi.fn().mockResolvedValue({
        data: [{ id: 'tag-id-1', slug: 'react' }],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'articles') return articleReadQuery;
        if (table === 'tags') return tagsQuery;
        if (table === 'drafts') return draftsUpdateQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
    } as never);

    await saveEditorDraftAction({
      contentId: 'article-1',
      contentType: 'article',
      draftId: 'draft-1',
      locale: 'ko',
      settings: {
        allowComments: true,
        githubUrl: '',
        publishAt: '2026-03-20T01:00:00.000Z',
        slug: 'draft-slug',
        thumbnailUrl: '',
        visibility: 'public',
        websiteUrl: '',
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

    expect(draftsUpdateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        publish_at: '2026-03-10T09:00:00.000Z',
      }),
    );
  });

  it('아직 공개 전인 예약 article draft 저장은 변경한 publish_at을 유지한다', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01T00:00:00.000Z'));

    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const articleReadQuery = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          publish_at: '2026-03-20T01:00:00.000Z',
          visibility: 'public',
        },
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const draftsUpdateQuery = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'draft-2',
          updated_at: '2026-03-14T10:00:00.000Z',
        },
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'articles') return articleReadQuery;
        if (table === 'tags') {
          return {
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
            select: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'drafts') return draftsUpdateQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
    } as never);

    await saveEditorDraftAction({
      contentId: 'article-2',
      contentType: 'article',
      draftId: 'draft-2',
      locale: 'ko',
      settings: {
        allowComments: true,
        githubUrl: '',
        publishAt: '2026-03-22T01:00:00.000Z',
        slug: 'draft-slug',
        thumbnailUrl: '',
        visibility: 'public',
        websiteUrl: '',
      },
      state: {
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
    });

    expect(draftsUpdateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        publish_at: '2026-03-22T01:00:00.000Z',
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
      data: { duplicate: false, source: null },
      schemaMissing: false,
    });

    const articleReadQuery = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          publish_at: '2026-03-10T09:00:00.000Z',
          visibility: 'public',
        },
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
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
        if (table === 'articles') {
          return articleReadQuery.select.mock.calls.length === 0
            ? articleReadQuery
            : articlesUpdateQuery;
        }
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

    const result = await publishEditorContentAction({
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
        githubUrl: '',
        publishAt: null,
        slug: 'published-article',
        thumbnailUrl: '',
        visibility: 'public',
        websiteUrl: '',
      },
    });

    expect(articlesUpdateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        publish_at: '2026-03-10T09:00:00.000Z',
      }),
    );
    expect(articlesUpdateQuery.update.mock.calls[0]?.[0]).not.toHaveProperty('updated_at');
    expect(result).toEqual({ redirectPath: '/ko/articles/published-article' });
    expect(revalidatePath).toHaveBeenCalledWith('/ko/articles');
    expect(revalidatePath).toHaveBeenCalledWith('/en/articles');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/articles/published-article');
    expect(revalidatePath).toHaveBeenCalledWith('/en/articles/published-article');
  });

  it('비공개 article 즉시 발행 수정 후에는 관리자 편집 경로로 이동한다', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-14T06:15:00.000Z'));

    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(checkSlugDuplicate).mockResolvedValue({
      data: { duplicate: false, source: null },
      schemaMissing: false,
    });

    const articleReadQuery = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          publish_at: '2026-03-10T09:00:00.000Z',
          visibility: 'public',
        },
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
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
        if (table === 'articles') {
          return articleReadQuery.select.mock.calls.length === 0
            ? articleReadQuery
            : articlesUpdateQuery;
        }
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

    const result = await publishEditorContentAction({
      contentId: 'article-1',
      contentType: 'article',
      draftId: 'draft-4',
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
        githubUrl: '',
        publishAt: null,
        slug: 'published-article',
        thumbnailUrl: '',
        visibility: 'private',
        websiteUrl: '',
      },
    });

    expect(result).toEqual({ redirectPath: '/ko/admin/articles/article-1/edit' });
  });

  it('아직 공개 전인 예약 article은 예약 발행 시각을 수정한 뒤 목록 경로로 이동한다', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01T00:00:00.000Z'));

    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(checkSlugDuplicate).mockResolvedValue({
      data: { duplicate: false, source: null },
      schemaMissing: false,
    });

    const articleReadQuery = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          publish_at: '2026-03-20T01:00:00.000Z',
          visibility: 'public',
        },
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
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
        if (table === 'articles') {
          return articleReadQuery.select.mock.calls.length === 0
            ? articleReadQuery
            : articlesUpdateQuery;
        }
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

    const result = await publishEditorContentAction({
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
        githubUrl: '',
        publishAt: '2026-03-22T01:00:00.000Z',
        slug: 'scheduled-article',
        thumbnailUrl: '',
        visibility: 'public',
        websiteUrl: '',
      },
    });

    expect(articlesUpdateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        publish_at: '2026-03-22T01:00:00.000Z',
      }),
    );
    expect(result).toEqual({ redirectPath: '/ko/articles' });
    expect(revalidatePath).toHaveBeenCalledWith('/ko/articles');
    expect(revalidatePath).toHaveBeenCalledWith('/ja/articles');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/articles/scheduled-article');
  });

  it('이미 등록된 article은 server action에서도 예약 발행 재설정을 거부한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });

    const articleReadQuery = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          publish_at: '2026-03-10T09:00:00.000Z',
          visibility: 'public',
        },
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'articles') return articleReadQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
    } as never);

    await expect(
      publishEditorContentAction({
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
          githubUrl: '',
          publishAt: '2026-03-20T01:00:00.000Z',
          slug: 'published-article',
          thumbnailUrl: '',
          visibility: 'public',
          websiteUrl: '',
        },
      }),
    ).rejects.toThrow(
      `__EDITOR_ERROR__:publishedContentCannotBeRescheduled:이미 공개된 글은 예약 발행으로 다시 전환할 수 없습니다.`,
    );
  });

  it('아직 공개 전인 예약 project는 예약 발행 시각을 수정한 뒤 목록 경로로 이동한다', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01T00:00:00.000Z'));

    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(checkSlugDuplicate).mockResolvedValue({
      data: { duplicate: false, source: null },
      schemaMissing: false,
    });

    const projectReadQuery = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          publish_at: '2026-03-20T01:00:00.000Z',
          visibility: 'public',
        },
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
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
    const projectTechStacksDeleteQuery = {
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
        if (table === 'projects') {
          return projectReadQuery.select.mock.calls.length === 0
            ? projectReadQuery
            : projectsUpdateQuery;
        }
        if (table === 'project_translations') {
          projectTranslationsFromCalls.push(table);
          return projectTranslationsFromCalls.length === 1
            ? translationsDeleteQuery
            : translationsInsertQuery;
        }
        if (table === 'project_tech_stacks') return projectTechStacksDeleteQuery;
        if (table === 'drafts') return draftsDeleteQuery;
        throw new Error(`unexpected table: ${table}`);
      }),
    } as never);

    const result = await publishEditorContentAction({
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
        allowComments: false,
        githubUrl: '',
        publishAt: '2026-03-22T01:00:00.000Z',
        slug: 'scheduled-project',
        thumbnailUrl: '',
        visibility: 'public',
        websiteUrl: '',
      },
    });

    expect(projectsUpdateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        publish_at: '2026-03-22T01:00:00.000Z',
      }),
    );
    expect(projectsUpdateQuery.update.mock.calls[0]?.[0]).not.toHaveProperty('allow_comments');
    expect(result).toEqual({ redirectPath: '/ko/project' });
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
  });
});
