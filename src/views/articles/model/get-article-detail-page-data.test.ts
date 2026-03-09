import { vi } from 'vitest';

import { getArticle } from '@/entities/article/api/get-article';
import { getArticleDetailList } from '@/entities/article/api/get-article-detail-list';
import { getArticleComments } from '@/entities/article-comment';
import { serializeLocaleAwareCreatedAtIdCursor } from '@/shared/lib/pagination/keyset-pagination';

import { getArticleDetailPageData } from './get-article-detail-page-data';

vi.mock('@/entities/article/api/get-article', () => ({
  getArticle: vi.fn(),
}));

vi.mock('@/entities/article/api/get-article-detail-list', () => ({
  getArticleDetailList: vi.fn(),
}));

vi.mock('@/entities/article-comment', () => ({
  getArticleComments: vi.fn(),
}));

describe('getArticleDetailPageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('현재 아티클이 목록에 없으면 맨 앞에 보정한다', async () => {
    const nextCursor = serializeLocaleAwareCreatedAtIdCursor({
      createdAt: '2026-03-01T00:00:00.000Z',
      id: 'archive-1',
      locale: 'ko',
    });

    vi.mocked(getArticle).mockResolvedValue({
      id: 'frontend',
      title: 'Frontend',
      description: 'cs',
      content: 'detail',
      thumbnail_url: null,
      tags: [],
      created_at: '2026-03-02T00:00:00.000Z',
      updated_at: null,
      view_count: 0,
    });
    vi.mocked(getArticleDetailList).mockResolvedValue({
      items: [
        {
          id: 'archive-1',
          title: 'Archive',
          description: null,
          created_at: '2026-03-01T00:00:00.000Z',
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
      articleId: 'frontend',
      locale: 'ko',
    });

    expect(result.archivePage.items[0]?.id).toBe('frontend');
    expect(result.archivePage.nextCursor).toBe(
      serializeLocaleAwareCreatedAtIdCursor({
        createdAt: '2026-03-02T00:00:00.000Z',
        id: 'frontend',
        locale: 'ko',
      }),
    );
    expect(result.item?.id).toBe('frontend');
    expect(result.initialCommentsPage.pageSize).toBe(10);
    expect(getArticleComments).toHaveBeenCalledWith({
      articleId: 'frontend',
      page: 1,
      sort: 'latest',
    });
  });

  it('아카이브 목록 조회 실패는 그대로 surface한다', async () => {
    vi.mocked(getArticle).mockResolvedValue(null);
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
        articleId: 'frontend',
        locale: 'ko',
      }),
    ).rejects.toThrow('archive failed');
  });

  it('현재 아티클이 이미 목록에 있으면 cursor를 그대로 둔다', async () => {
    const nextCursor = serializeLocaleAwareCreatedAtIdCursor({
      createdAt: '2026-03-01T00:00:00.000Z',
      id: 'archive-1',
      locale: 'ko',
    });

    vi.mocked(getArticle).mockResolvedValue({
      id: 'archive-1',
      title: 'Archive',
      description: 'cs',
      content: 'detail',
      thumbnail_url: null,
      tags: [],
      created_at: '2026-03-01T00:00:00.000Z',
      updated_at: null,
      view_count: 0,
    });
    vi.mocked(getArticleDetailList).mockResolvedValue({
      items: [
        {
          id: 'archive-1',
          title: 'Archive',
          description: null,
          created_at: '2026-03-01T00:00:00.000Z',
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
      articleId: 'archive-1',
      locale: 'ko',
    });

    expect(result.archivePage.nextCursor).toBe(nextCursor);
    expect(result.archivePage.items).toHaveLength(1);
  });
});
