import { isValidElement } from 'react';
import { vi } from 'vitest';

import { getArticleDetailPageData } from '@/views/articles';

import ArticleDetailRoute from './page';

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('@/views/articles', () => ({
  getArticleDetailPageData: vi.fn(async () => ({
    archivePage: {
      items: [],
      nextCursor: null,
    },
    initialCommentsPage: {
      items: [],
      page: 1,
      pageSize: 10,
      sort: 'latest',
      totalCount: 0,
      totalPages: 0,
    },
    item: null,
  })),
  ArticleDetailPage: function ArticleDetailPage() {
    return null;
  },
}));

describe('ArticleDetailRoute', () => {
  it('아티클 상세 뷰 엔트리와 데이터를 반환한다', async () => {
    vi.mocked(getArticleDetailPageData).mockResolvedValueOnce({
      archivePage: {
        items: [],
        nextCursor: null,
      },
      initialCommentsPage: {
        items: [],
        page: 1,
        pageSize: 10,
        sort: 'latest',
        totalCount: 0,
        totalPages: 0,
      },
      item: {
        id: 'frontend-performance',
        title: 'Frontend Performance',
        description: 'detail',
        content: '# heading',
        thumbnail_url: null,
        tags: ['react'],
        created_at: '2026-03-01T00:00:00.000Z',
        updated_at: null,
      },
    });

    const element = await ArticleDetailRoute({
      params: Promise.resolve({
        id: 'frontend-performance',
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('ArticleDetailPage');
    expect(element.props.locale).toBe('ko');
    expect(element.props.initialCommentsPage.pageSize).toBe(10);
    expect(getArticleDetailPageData).toHaveBeenCalledWith({
      articleId: 'frontend-performance',
      locale: 'ko',
    });
  });

  it('데이터가 없으면 notFound를 호출한다', async () => {
    vi.mocked(getArticleDetailPageData).mockResolvedValueOnce({
      archivePage: {
        items: [],
        nextCursor: null,
      },
      initialCommentsPage: {
        items: [],
        page: 1,
        pageSize: 10,
        sort: 'latest',
        totalCount: 0,
        totalPages: 0,
      },
      item: null,
    });

    await expect(
      ArticleDetailRoute({
        params: Promise.resolve({
          id: 'missing-article',
          locale: 'ko',
        }),
      }),
    ).rejects.toThrow('NOT_FOUND');

    expect(getArticleDetailPageData).toHaveBeenCalledWith({
      articleId: 'missing-article',
      locale: 'ko',
    });
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
