import { vi } from 'vitest';

import { GET } from '@/app/api/(content)/article-popular-tags/route';
import { getPopularArticleTags } from '@/entities/article/api/list/get-popular-article-tags';
import { getTagLabelMapBySlugs } from '@/entities/tag/api/query-tags';

vi.mock('@/entities/article/api/list/get-popular-article-tags', () => ({
  getPopularArticleTags: vi.fn(),
}));

vi.mock('@/entities/tag/api/query-tags', () => ({
  getTagLabelMapBySlugs: vi.fn(),
}));

describe('api/article-popular-tags route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('locale 기준 인기 태그 목록을 반환한다', async () => {
    vi.mocked(getPopularArticleTags).mockResolvedValue([
      {
        article_count: 3,
        tag: 'nextjs',
      },
    ]);
    vi.mocked(getTagLabelMapBySlugs).mockResolvedValue({
      data: new Map([['nextjs', 'Next.js']]),
      schemaMissing: false,
    });

    const response = await GET(new Request('https://chaen.dev/api/article-popular-tags?locale=ko'));

    expect(response.status).toBe(200);
    expect(getPopularArticleTags).toHaveBeenCalledWith({ locale: 'ko' });
    expect(getTagLabelMapBySlugs).toHaveBeenCalledWith({
      locale: 'ko',
      slugs: ['nextjs'],
    });
    expect(await response.json()).toEqual([
      {
        article_count: 3,
        label: 'Next.js',
        tag: 'nextjs',
      },
    ]);
  });

  it('인기 태그가 비어 있으면 label 조회를 건너뛴다', async () => {
    vi.mocked(getPopularArticleTags).mockResolvedValue([]);

    const response = await GET(new Request('https://chaen.dev/api/article-popular-tags?locale=ko'));

    expect(response.status).toBe(200);
    expect(getTagLabelMapBySlugs).not.toHaveBeenCalled();
    expect(await response.json()).toEqual([]);
  });
});
