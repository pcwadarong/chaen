import { vi } from 'vitest';

import { getArticles } from '@/entities/article/api/get-articles';
import { getPopularArticleTags } from '@/entities/article/api/get-popular-article-tags';
import { getTagLabelMapBySlugs } from '@/entities/tag/api/query-tags';

import {
  getArticlesPageData,
  normalizeSearchParams,
  normalizeTagParams,
} from './get-articles-page-data';

vi.mock('@/entities/article/api/get-articles', () => ({
  getArticles: vi.fn(),
}));

vi.mock('@/entities/article/api/get-popular-article-tags', () => ({
  getPopularArticleTags: vi.fn(),
}));

vi.mock('@/entities/tag/api/query-tags', () => ({
  getTagLabelMapBySlugs: vi.fn(),
}));

describe('getArticlesPageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('아티클 목록 초기 페이지 데이터를 컨테이너 props 형태로 반환한다', async () => {
    vi.mocked(getArticles).mockResolvedValue({
      items: [
        {
          id: 'article-1',
          title: 'a1',
          description: 'd1',
          thumbnail_url: null,
          created_at: '2026-03-01T00:00:00.000Z',
        },
      ],
      nextCursor: '12',
      totalCount: 1,
    });
    vi.mocked(getPopularArticleTags).mockResolvedValue([
      {
        article_count: 5,
        tag: 'nextjs',
      },
    ]);
    vi.mocked(getTagLabelMapBySlugs).mockResolvedValue({
      data: new Map([['nextjs', 'Next.js']]),
      schemaMissing: false,
    });

    const data = await getArticlesPageData({ locale: 'ko', query: 'react' });

    expect(getArticles).toHaveBeenCalledWith({ locale: 'ko', query: 'react', tag: '' });
    expect(data).toEqual({
      activeTag: '',
      initialCursor: '12',
      initialItems: expect.any(Array),
      locale: 'ko',
      popularTags: [
        {
          article_count: 5,
          label: 'Next.js',
          tag: 'nextjs',
        },
      ],
      searchQuery: 'react',
    });
  });

  it('아티클 조회 실패 시 에러를 그대로 전파한다', async () => {
    vi.mocked(getArticles).mockRejectedValue(new Error('temporary failure'));
    vi.mocked(getTagLabelMapBySlugs).mockResolvedValue({
      data: new Map(),
      schemaMissing: false,
    });

    await expect(getArticlesPageData({ locale: 'ko', query: '' })).rejects.toThrow(
      'temporary failure',
    );
  });

  it('배열 searchParams는 첫 번째 값만 trim하여 사용한다', () => {
    expect(normalizeSearchParams([' react ', 'vue'])).toBe('react');
  });

  it('비어 있거나 없는 searchParams는 빈 문자열로 정규화한다', () => {
    expect(normalizeSearchParams('   ')).toBe('');
    expect(normalizeSearchParams(undefined)).toBe('');
  });

  it('비어 있거나 없는 tag searchParams는 빈 문자열로 정규화한다', () => {
    expect(normalizeTagParams('   ')).toBe('');
    expect(normalizeTagParams(undefined)).toBe('');
  });

  it('태그 searchParams도 첫 번째 값만 trim하여 사용한다', async () => {
    vi.mocked(getArticles).mockResolvedValue({
      items: [],
      nextCursor: null,
      totalCount: 0,
    });
    vi.mocked(getPopularArticleTags).mockResolvedValue([]);
    vi.mocked(getTagLabelMapBySlugs).mockResolvedValue({
      data: new Map(),
      schemaMissing: false,
    });

    const data = await getArticlesPageData({
      locale: 'ko',
      query: undefined,
      tag: [' NextJS ', 'react'],
    });

    expect(getArticles).toHaveBeenCalledWith({ locale: 'ko', query: '', tag: 'nextjs' });
    expect(data.activeTag).toBe('nextjs');
  });
});
