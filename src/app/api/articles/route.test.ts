import { GET } from '@/app/api/articles/route';
import { getArticles } from '@/entities/article/api/list/get-articles';

vi.mock('@/entities/article/api/list/get-articles', () => ({
  getArticles: vi.fn(),
}));

describe('GET /api/articles', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('정규화된 query로 아티클 페이지를 반환한다', async () => {
    vi.mocked(getArticles).mockResolvedValue({
      items: [],
      nextCursor: null,
      totalCount: 0,
    });

    const response = await GET(
      new Request(
        'https://chaen.dev/api/articles?cursor=%20cursor-1%20&limit=12&locale=ko&q=%20react%20&tag=%20nextjs%20',
      ),
    );

    expect(getArticles).toHaveBeenCalledWith({
      cursor: 'cursor-1',
      limit: 12,
      locale: 'ko',
      query: 'react',
      tag: 'nextjs',
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      'public, s-maxage=60, stale-while-revalidate=300',
    );
    await expect(response.json()).resolves.toEqual({
      items: [],
      nextCursor: null,
      totalCount: 0,
    });
  });

  it('유효하지 않은 query는 400을 반환한다', async () => {
    const response = await GET(new Request('https://chaen.dev/api/articles?limit=0&locale=ko'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'limit은 1 이상이어야 합니다.',
    });
  });
});
