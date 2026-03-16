import { getEditorDraftSummaries } from '@/entities/editor/api/editor-read';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
}));

describe('editor-read', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('article/project draft와 resume_drafts를 합쳐 최신순으로 반환한다', async () => {
    const draftsQuery = {
      from: vi.fn(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            content_id: 'article-1',
            content_type: 'article',
            id: 'draft-1',
            title: { ko: '아티클 초안' },
            updated_at: '2026-03-12T10:00:00.000Z',
          },
        ],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const resumeDraftsQuery = {
      from: vi.fn(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            contents: {
              ko: {
                title: '이력서 초안',
              },
            },
            id: 'resume-draft-1',
            updated_at: '2026-03-13T09:00:00.000Z',
          },
        ],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi
        .fn()
        .mockImplementation((table: string) =>
          table === 'drafts' ? draftsQuery : resumeDraftsQuery,
        ),
    } as never);

    await expect(getEditorDraftSummaries()).resolves.toEqual([
      {
        contentId: null,
        contentType: 'resume',
        id: 'resume-draft-1',
        title: '이력서 초안',
        updatedAt: '2026-03-13T09:00:00.000Z',
      },
      {
        contentId: 'article-1',
        contentType: 'article',
        id: 'draft-1',
        title: '아티클 초안',
        updatedAt: '2026-03-12T10:00:00.000Z',
      },
    ]);
  });

  it('resume_drafts의 한국어 제목이 없으면 기본 제목을 사용한다', async () => {
    const draftsQuery = {
      from: vi.fn(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };
    const resumeDraftsQuery = {
      from: vi.fn(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            contents: {
              en: {
                title: 'Resume Draft',
              },
              ko: {
                title: '   ',
              },
            },
            id: 'resume-draft-1',
            updated_at: '2026-03-13T09:00:00.000Z',
          },
        ],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi
        .fn()
        .mockImplementation((table: string) =>
          table === 'drafts' ? draftsQuery : resumeDraftsQuery,
        ),
    } as never);

    await expect(getEditorDraftSummaries()).resolves.toEqual([
      {
        contentId: null,
        contentType: 'resume',
        id: 'resume-draft-1',
        title: '(제목 없음)',
        updatedAt: '2026-03-13T09:00:00.000Z',
      },
    ]);
  });
});
