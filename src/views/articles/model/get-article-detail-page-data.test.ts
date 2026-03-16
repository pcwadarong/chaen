import { vi } from 'vitest';

import { getResolvedArticle } from '@/entities/article/api/detail/get-article';
import { getArticleDetailList } from '@/entities/article/api/detail/get-article-detail-list';
import { getRelatedArticles } from '@/entities/article/api/detail/get-related-articles';
import { getArticleComments } from '@/entities/article/comment';
import { serializeLocaleAwarePublishedAtIdCursor } from '@/shared/lib/pagination/keyset-pagination';
import { getArticleDetailPageData } from '@/views/articles/model/get-article-detail-page-data';

vi.mock('@/entities/article/api/detail/get-article', () => ({
  getResolvedArticle: vi.fn(),
}));

vi.mock('@/entities/article/api/detail/get-related-articles', () => ({
  getRelatedArticles: vi.fn(),
}));

vi.mock('@/entities/article/api/detail/get-article-detail-list', () => ({
  getArticleDetailList: vi.fn(),
}));

vi.mock('@/entities/article/comment', () => ({
  getArticleComments: vi.fn(),
}));

describe('getArticleDetailPageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('현재 아티클이 목록에 없으면 맨 앞에 보정한다', async () => {
    const nextCursor = serializeLocaleAwarePublishedAtIdCursor({
      id: 'archive-1',
      locale: 'ko',
      publishedAt: '2026-03-01T00:00:00.000Z',
    });

    vi.mocked(getResolvedArticle).mockResolvedValue({
      item: {
        id: 'frontend',
        title: 'Frontend',
        description: 'cs',
        content: 'detail',
        thumbnail_url: null,
        tags: [],
        created_at: '2026-03-02T00:00:00.000Z',
        publish_at: '2026-03-02T00:00:00.000Z',
        slug: 'frontend',
        updated_at: null,
        view_count: 0,
      },
      resolvedLocale: 'en',
    });
    vi.mocked(getRelatedArticles).mockResolvedValue([]);
    vi.mocked(getArticleDetailList).mockResolvedValue({
      items: [
        {
          id: 'archive-1',
          title: 'Archive',
          description: null,
          publish_at: '2026-03-01T00:00:00.000Z',
          slug: 'archive-1',
        },
      ],
      nextCursor,
    });
    vi.mocked(getArticleComments).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 10,
      sort: 'latest',
      totalCount: 0,
      totalPages: 0,
    });

    const result = await getArticleDetailPageData({
      articleSlug: 'frontend',
      locale: 'ko',
    });

    expect(result.archivePage.items[0]?.id).toBe('frontend');
    expect(result.archivePage.nextCursor).toBe(
      serializeLocaleAwarePublishedAtIdCursor({
        id: 'frontend',
        locale: 'ko',
        publishedAt: '2026-03-02T00:00:00.000Z',
      }),
    );
    expect(result.item?.id).toBe('frontend');
    expect(result.relatedArticles).toEqual([]);
    expect(result.initialCommentsPage.pageSize).toBe(10);
    expect(getArticleComments).toHaveBeenCalledWith({
      articleId: 'frontend',
      page: 1,
      sort: 'latest',
    });
    expect(getRelatedArticles).toHaveBeenCalledWith({
      articleId: 'frontend',
      locale: 'en',
    });
  });

  it('아카이브 목록 조회 실패는 그대로 surface한다', async () => {
    vi.mocked(getResolvedArticle).mockResolvedValue({
      item: null,
      resolvedLocale: null,
    });
    vi.mocked(getArticleDetailList).mockRejectedValue(new Error('archive failed'));
    vi.mocked(getArticleComments).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 10,
      sort: 'latest',
      totalCount: 0,
      totalPages: 0,
    });

    await expect(
      getArticleDetailPageData({
        articleSlug: 'frontend',
        locale: 'ko',
      }),
    ).rejects.toThrow('archive failed');
  });

  it('현재 아티클이 이미 목록에 있으면 cursor를 그대로 둔다', async () => {
    const nextCursor = serializeLocaleAwarePublishedAtIdCursor({
      id: 'archive-1',
      locale: 'ko',
      publishedAt: '2026-03-01T00:00:00.000Z',
    });

    vi.mocked(getResolvedArticle).mockResolvedValue({
      item: {
        id: 'archive-1',
        title: 'Archive',
        description: 'cs',
        content: 'detail',
        thumbnail_url: null,
        tags: [],
        created_at: '2026-03-01T00:00:00.000Z',
        publish_at: '2026-03-01T00:00:00.000Z',
        slug: 'archive-1',
        updated_at: null,
        view_count: 0,
      },
      resolvedLocale: 'ko',
    });
    vi.mocked(getRelatedArticles).mockResolvedValue([
      {
        id: 'archive-2',
        title: 'Related',
        description: 'related item',
        thumbnail_url: null,
        publish_at: '2026-02-25T00:00:00.000Z',
        slug: 'archive-2',
      },
    ]);
    vi.mocked(getArticleDetailList).mockResolvedValue({
      items: [
        {
          id: 'archive-1',
          title: 'Archive',
          description: null,
          publish_at: '2026-03-01T00:00:00.000Z',
          slug: 'archive-1',
        },
      ],
      nextCursor,
    });
    vi.mocked(getArticleComments).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 10,
      sort: 'latest',
      totalCount: 0,
      totalPages: 0,
    });

    const result = await getArticleDetailPageData({
      articleSlug: 'archive-1',
      locale: 'ko',
    });

    expect(result.archivePage.nextCursor).toBe(nextCursor);
    expect(result.archivePage.items).toHaveLength(1);
    expect(result.relatedArticles[0]?.id).toBe('archive-2');
  });

  it('관련 글 조회 실패는 빈 목록으로 대체한다', async () => {
    vi.mocked(getResolvedArticle).mockResolvedValue({
      item: {
        id: 'frontend',
        title: 'Frontend',
        description: 'cs',
        content: 'detail',
        thumbnail_url: null,
        tags: [],
        created_at: '2026-03-02T00:00:00.000Z',
        publish_at: '2026-03-02T00:00:00.000Z',
        slug: 'frontend',
        updated_at: null,
        view_count: 0,
      },
      resolvedLocale: 'ko',
    });
    vi.mocked(getRelatedArticles).mockRejectedValue(new Error('rpc failed'));
    vi.mocked(getArticleDetailList).mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    vi.mocked(getArticleComments).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 10,
      sort: 'latest',
      totalCount: 0,
      totalPages: 0,
    });

    const result = await getArticleDetailPageData({
      articleSlug: 'frontend',
      locale: 'ko',
    });

    expect(result.relatedArticles).toEqual([]);
  });
});
