/** @vitest-environment node */

import { getResumeEditorSeed } from '@/entities/resume/api/resume-editor-read';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
}));

describe('resume-editor-read', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('service role이 없을 때, getResumeEditorSeed는 기본 seed를 반환해야 한다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(null);

    const result = await getResumeEditorSeed();

    expect(result.initialDraftId).toBeNull();
    expect(result.initialSavedAt).toBeNull();
    expect(result.initialContents.ko.title).toBe('박채원 (Park Chaewon)');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('draft 조회가 실패할 때, getResumeEditorSeed는 기본 콘텐츠만 유지해야 한다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const contentQuery = {
      select: vi.fn().mockResolvedValue({
        data: [
          {
            body: '한국어 본문',
            description: '한국어 설명',
            locale: 'ko',
            title: '이력서',
            updated_at: '2026-03-30T00:00:00.000Z',
          },
        ],
        error: null,
      }),
    };
    const draftQuery = {
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };

    draftQuery.limit.mockResolvedValue({
      data: null,
      error: {
        message: 'draft query failed',
      },
    });

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi
        .fn()
        .mockImplementation((table: string) =>
          table === 'resume_contents' ? contentQuery : draftQuery,
        ),
    } as never);

    const result = await getResumeEditorSeed();

    expect(result.initialDraftId).toBeNull();
    expect(result.initialContents.ko.title).toBe('이력서');
    expect(result.initialSavedAt).toBe('2026-03-30T00:00:00.000Z');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
