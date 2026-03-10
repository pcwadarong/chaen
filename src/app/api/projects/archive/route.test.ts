import { vi } from 'vitest';

import { getProjectDetailList } from '@/entities/project/api/get-project-detail-list';
import { serializeLocaleAwareCreatedAtIdCursor } from '@/shared/lib/pagination/keyset-pagination';

import { GET } from './route';

vi.mock('@/entities/project/api/get-project-detail-list', () => ({
  getProjectDetailList: vi.fn(),
}));

describe('GET /api/projects/archive', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('성공 시 items와 nextCursor를 반환한다', async () => {
    const nextCursor = serializeLocaleAwareCreatedAtIdCursor({
      createdAt: '2026-03-02T09:07:50.797695+00:00',
      id: 'project-2',
      locale: 'ko',
    });

    vi.mocked(getProjectDetailList).mockResolvedValue({
      items: [],
      nextCursor,
    });

    const response = await GET(
      new Request('http://localhost:3000/api/projects/archive?locale=ko&limit=10'),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.nextCursor).toBe(nextCursor);
    expect(getProjectDetailList).toHaveBeenCalledWith({
      cursor: null,
      limit: 10,
      locale: 'ko',
    });
  });

  it('실패 시 500과 reason을 반환한다', async () => {
    vi.mocked(getProjectDetailList).mockRejectedValue(new Error('db failed'));

    const response = await GET(new Request('http://localhost:3000/api/projects/archive?locale=ko'));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.ok).toBe(false);
    expect(payload.reason).toBe('db failed');
  });
});
