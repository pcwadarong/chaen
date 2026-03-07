import { vi } from 'vitest';

import { getProjects } from '@/entities/project/api/get-projects';
import { serializeCreatedAtIdCursor } from '@/shared/lib/pagination/keyset-pagination';

import { GET } from './route';

vi.mock('@/entities/project/api/get-projects', () => ({
  getProjects: vi.fn(),
}));

describe('GET /api/projects', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('성공 시 items와 nextCursor를 반환한다', async () => {
    const nextCursor = serializeCreatedAtIdCursor({
      createdAt: '2026-03-02T09:07:50.797695+00:00',
      id: 'project-2',
    });

    vi.mocked(getProjects).mockResolvedValue({
      items: [],
      nextCursor,
    });

    const response = await GET(
      new Request('http://localhost:3000/api/projects?locale=ko&limit=12'),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.nextCursor).toBe(nextCursor);
    expect(getProjects).toHaveBeenCalledWith({
      cursor: null,
      limit: 12,
      locale: 'ko',
    });
  });

  it('실패 시 500과 reason을 반환한다', async () => {
    vi.mocked(getProjects).mockRejectedValue(new Error('db failed'));

    const response = await GET(new Request('http://localhost:3000/api/projects?locale=ko'));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.ok).toBe(false);
    expect(payload.reason).toBe('db failed');
  });
});
