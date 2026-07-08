import { vi } from 'vitest';

import { GET } from '@/app/api/(content)/article-popular-tags/route';
import { getLocalizedPopularArticleTags } from '@/entities/article/api/list/get-popular-article-tags';

vi.mock('@/entities/article/api/list/get-popular-article-tags', () => ({
  getLocalizedPopularArticleTags: vi.fn(),
}));

describe('api/article-popular-tags route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('locale 기준 label이 결합된 인기 태그 목록을 반환한다', async () => {
    vi.mocked(getLocalizedPopularArticleTags).mockResolvedValue([
      {
        article_count: 3,
        label: 'Next.js',
        tag: 'nextjs',
      },
    ]);

    const response = await GET(new Request('https://chaen.dev/api/article-popular-tags?locale=ko'));

    expect(response.status).toBe(200);
    expect(getLocalizedPopularArticleTags).toHaveBeenCalledWith({ locale: 'ko' });
    expect(await response.json()).toEqual([
      {
        article_count: 3,
        label: 'Next.js',
        tag: 'nextjs',
      },
    ]);
  });

  it('인기 태그가 비어 있으면 빈 배열을 반환한다', async () => {
    vi.mocked(getLocalizedPopularArticleTags).mockResolvedValue([]);

    const response = await GET(new Request('https://chaen.dev/api/article-popular-tags?locale=ko'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });
});
