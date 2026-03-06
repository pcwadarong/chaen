import { vi } from 'vitest';

import { getArticles } from '@/entities/article/api/get-articles';

import { getArticlesPageData } from './get-articles-page-data';

vi.mock('@/entities/article/api/get-articles', () => ({
  getArticles: vi.fn(),
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
    });

    const data = await getArticlesPageData({ locale: 'ko', query: 'react' });

    expect(getArticles).toHaveBeenCalledWith({ locale: 'ko', query: 'react' });
    expect(data).toEqual({
      initialCursor: '12',
      initialItems: expect.any(Array),
      locale: 'ko',
      searchQuery: 'react',
    });
  });

  it('아티클 조회 실패 시 빈 초기값으로 폴백한다', async () => {
    vi.mocked(getArticles).mockRejectedValue(new Error('temporary failure'));

    const data = await getArticlesPageData({ locale: 'ko', query: '' });

    expect(data).toEqual({
      initialCursor: null,
      initialItems: [],
      locale: 'ko',
      searchQuery: '',
    });
  });
});
