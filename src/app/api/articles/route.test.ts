import { vi } from 'vitest';

import { getArticles } from '@/entities/article/api/get-articles';
import { serializeCreatedAtIdCursor } from '@/shared/lib/pagination/keyset-pagination';

import { GET } from './route';

vi.mock('@/entities/article/api/get-articles', () => ({
  getArticles: vi.fn(),
}));

describe('GET /api/articles', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('성공 시 items와 nextCursor를 반환한다', async () => {
    const nextCursor = serializeCreatedAtIdCursor({
      createdAt: '2026-03-02T09:07:50.797695+00:00',
      id: 'article-2',
    });

    vi.mocked(getArticles).mockResolvedValue({
      items: [],
      nextCursor,
      totalCount: null,
    });

    const response = await GET(
      new Request('http://localhost:3000/api/articles?locale=ko&limit=12'),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.nextCursor).toBe(nextCursor);
    expect(payload.totalCount).toBeNull();
    expect(getArticles).toHaveBeenCalledWith({
      cursor: null,
      limit: 12,
      locale: 'ko',
      query: null,
    });
  });

  it('검색어가 있으면 그대로 전달한다', async () => {
    vi.mocked(getArticles).mockResolvedValue({
      items: [],
      nextCursor: null,
      totalCount: 3,
    });

    const response = await GET(new Request('http://localhost:3000/api/articles?locale=ko&q=react'));
    const payload = await response.json();

    expect(getArticles).toHaveBeenCalledWith({
      cursor: null,
      limit: undefined,
      locale: 'ko',
      query: 'react',
    });
    expect(payload.totalCount).toBe(3);
  });

  it('실패 시 500과 reason을 반환한다', async () => {
    vi.mocked(getArticles).mockRejectedValue(new Error('db failed'));

    const response = await GET(new Request('http://localhost:3000/api/articles?locale=ko'));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.ok).toBe(false);
    expect(payload.reason).toBe('db failed');
  });
});
