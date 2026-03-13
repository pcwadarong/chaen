import { vi } from 'vitest';

import sitemap from './sitemap';

const { fromMock, inMock, notMock, selectMock, supabaseClientMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  inMock: vi.fn(),
  notMock: vi.fn(),
  selectMock: vi.fn(),
  supabaseClientMock: {
    from: vi.fn(),
  },
}));

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient: vi.fn(() => supabaseClientMock),
}));

describe('sitemap', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://chaen.dev';

    inMock.mockReset();
    notMock.mockReset();
    selectMock.mockReset();
    fromMock.mockReset();
    supabaseClientMock.from.mockReset();

    const articleQuery = {
      not: notMock,
    };
    const projectQuery = {
      not: notMock,
    };

    notMock
      .mockImplementationOnce(() => articleQuery)
      .mockResolvedValueOnce({
        data: [
          {
            article_id: 'article-1',
            locale: 'ko',
            articles: {
              publish_at: '2026-03-10T00:00:00.000Z',
              slug: 'article-1-slug',
              updated_at: '2026-03-10T00:00:00.000Z',
            },
          },
        ],
        error: null,
      })
      .mockImplementationOnce(() => projectQuery)
      .mockResolvedValueOnce({
        data: [
          {
            locale: 'en',
            project_id: 'project-1',
            projects: {
              publish_at: '2026-03-09T00:00:00.000Z',
              slug: 'project-1-slug',
              updated_at: '2026-03-09T00:00:00.000Z',
            },
          },
        ],
        error: null,
      });

    inMock.mockImplementationOnce(() => articleQuery).mockImplementationOnce(() => projectQuery);

    selectMock.mockReturnValue({
      in: inMock,
    });

    fromMock.mockReturnValue({
      select: selectMock,
    });

    supabaseClientMock.from.mockImplementation(fromMock);
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('홈, 이력서, 프로젝트 목록, 상세 페이지를 sitemap에 포함한다', async () => {
    const entries = await sitemap();

    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          priority: 1,
          url: 'https://chaen.dev/ko',
        }),
        expect.objectContaining({
          priority: 0.8,
          url: 'https://chaen.dev/ko/resume',
        }),
        expect.objectContaining({
          priority: 0.8,
          url: 'https://chaen.dev/ko/project',
        }),
        expect.objectContaining({
          priority: 0.8,
          url: 'https://chaen.dev/ko/articles/article-1-slug',
        }),
        expect.objectContaining({
          priority: 0.8,
          url: 'https://chaen.dev/en/project/project-1-slug',
        }),
      ]),
    );
  });

  it('게스트북 페이지는 sitemap에 포함하지 않는다', async () => {
    const entries = await sitemap();

    expect(entries).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: 'https://chaen.dev/ko/guest',
        }),
      ]),
    );
  });
});
