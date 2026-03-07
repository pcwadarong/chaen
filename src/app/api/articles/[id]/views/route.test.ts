import { vi } from 'vitest';

import { incrementArticleViewCount } from '@/entities/article/api/increment-article-view-count';

import { POST } from './route';

vi.mock('@/entities/article/api/increment-article-view-count', () => ({
  incrementArticleViewCount: vi.fn(),
}));

describe('POST /api/articles/[id]/views', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('성공 시 최신 조회수를 반환한다', async () => {
    vi.mocked(incrementArticleViewCount).mockResolvedValue(34);

    const response = await POST(new Request('http://localhost:3000/api/articles/frontend/views'), {
      params: Promise.resolve({ id: 'frontend' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      viewCount: 34,
    });
    expect(incrementArticleViewCount).toHaveBeenCalledWith('frontend');
  });

  it('service role env가 없으면 503을 반환한다', async () => {
    vi.mocked(incrementArticleViewCount).mockRejectedValue(
      new Error('service role env is not configured'),
    );

    const response = await POST(new Request('http://localhost:3000/api/articles/frontend/views'), {
      params: Promise.resolve({ id: 'frontend' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.reason).toBe('service role env is not configured');
  });
});
