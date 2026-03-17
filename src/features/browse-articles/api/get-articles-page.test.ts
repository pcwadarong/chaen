import { getArticles } from '@/entities/article/api/list/get-articles';
import { getArticlesPageAction } from '@/features/browse-articles/api/get-articles-page';

vi.mock('@/entities/article/api/list/get-articles', () => ({
  getArticles: vi.fn(),
}));

describe('getArticlesPageAction', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('정규화된 조건으로 아티클 목록을 조회한다', async () => {
    vi.mocked(getArticles).mockResolvedValue({
      items: [],
      nextCursor: null,
      totalCount: 0,
    });

    const result = await getArticlesPageAction({
      cursor: ' cursor-1 ',
      limit: 12,
      locale: 'ko',
      query: ' react ',
      tag: ' nextjs ',
    });

    expect(getArticles).toHaveBeenCalledWith({
      cursor: 'cursor-1',
      limit: 12,
      locale: 'ko',
      query: 'react',
      tag: 'nextjs',
    });
    expect(result).toEqual({
      data: {
        items: [],
        nextCursor: null,
        totalCount: 0,
      },
      errorMessage: null,
      ok: true,
    });
  });
});
