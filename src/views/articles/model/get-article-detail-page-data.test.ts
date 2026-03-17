import { vi } from 'vitest';

import { getResolvedArticle } from '@/entities/article/api/detail/get-article';
import { getArticleDetailList } from '@/entities/article/api/detail/get-article-detail-list';
import { getRelatedArticles } from '@/entities/article/api/detail/get-related-articles';
import { getTagLabelMapBySlugs } from '@/entities/tag/api/query-tags';
import { serializeLocaleAwarePublishedAtIdCursor } from '@/shared/lib/pagination/keyset-pagination';
import {
  getArticleDetailArchivePageData,
  getArticleDetailRelatedArticlesData,
  getArticleDetailShellData,
  getArticleTagLabels,
} from '@/views/articles/model/get-article-detail-page-data';

vi.mock('@/entities/article/api/detail/get-article', () => ({
  getResolvedArticle: vi.fn(),
}));

vi.mock('@/entities/article/api/detail/get-related-articles', () => ({
  getRelatedArticles: vi.fn(),
}));

vi.mock('@/entities/article/api/detail/get-article-detail-list', () => ({
  getArticleDetailList: vi.fn(),
}));

vi.mock('@/entities/tag/api/query-tags', () => ({
  getTagLabelMapBySlugs: vi.fn(),
}));

describe('article detail page data helpers', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shell helper는 상세 본문 최소 데이터만 조회한다', async () => {
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

    await expect(
      getArticleDetailShellData({
        articleSlug: 'frontend',
        locale: 'ko',
      }),
    ).resolves.toMatchObject({
      item: {
        id: 'frontend',
      },
      resolvedLocale: 'en',
    });
  });

  it('현재 아티클이 목록에 없으면 아카이브 맨 앞에 보정한다', async () => {
    const nextCursor = serializeLocaleAwarePublishedAtIdCursor({
      id: 'archive-1',
      locale: 'ko',
      publishedAt: '2026-03-01T00:00:00.000Z',
    });

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

    const result = await getArticleDetailArchivePageData({
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
      locale: 'ko',
    });

    expect(result.items[0]?.id).toBe('frontend');
    expect(result.nextCursor).toBe(
      serializeLocaleAwarePublishedAtIdCursor({
        id: 'frontend',
        locale: 'ko',
        publishedAt: '2026-03-02T00:00:00.000Z',
      }),
    );
  });

  it('아카이브 helper는 조회 실패 시 현재 항목만 유지한 빈 목록으로 폴백한다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(getArticleDetailList).mockRejectedValue(new Error('archive failed'));

    await expect(
      getArticleDetailArchivePageData({
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
        locale: 'ko',
      }),
    ).resolves.toEqual({
      items: [
        {
          id: 'frontend',
          title: 'Frontend',
          description: 'cs',
          publish_at: '2026-03-02T00:00:00.000Z',
          slug: 'frontend',
        },
      ],
      nextCursor: null,
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[articles] getArticleDetailList failed for locale',
      expect.objectContaining({
        error: expect.any(Error),
        locale: 'ko',
      }),
    );
  });

  it('관련 글 helper는 조회 실패를 빈 목록으로 대체한다', async () => {
    vi.mocked(getRelatedArticles).mockRejectedValue(new Error('rpc failed'));

    await expect(
      getArticleDetailRelatedArticlesData({
        articleId: 'frontend',
        locale: 'ko',
      }),
    ).resolves.toEqual([]);
  });

  it('태그 label helper는 schema가 없으면 slug를 그대로 사용한다', async () => {
    vi.mocked(getTagLabelMapBySlugs).mockResolvedValue({
      data: new Map(),
      schemaMissing: true,
    });

    await expect(
      getArticleTagLabels({
        item: {
          id: 'frontend',
          title: 'Frontend',
          description: 'cs',
          content: 'detail',
          thumbnail_url: null,
          tags: ['react'],
          created_at: '2026-03-02T00:00:00.000Z',
          publish_at: '2026-03-02T00:00:00.000Z',
          slug: 'frontend',
          updated_at: null,
          view_count: 0,
        },
        locale: 'ko',
      }),
    ).resolves.toEqual(['react']);
  });
});
