import { GET } from '@/app/api/projects/route';
import { getProjects } from '@/entities/project/api/list/get-projects';

vi.mock('@/entities/project/api/list/get-projects', () => ({
  getProjects: vi.fn(),
}));

describe('GET /api/projects', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('정규화된 query로 프로젝트 페이지를 반환한다', async () => {
    vi.mocked(getProjects).mockResolvedValue({
      items: [],
      nextCursor: 'cursor-1',
    });

    const response = await GET(
      new Request('https://chaen.dev/api/projects?cursor=%20x%20&limit=12&locale=ko'),
    );

    expect(getProjects).toHaveBeenCalledWith({
      cursor: 'x',
      limit: 12,
      locale: 'ko',
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      'public, s-maxage=60, stale-while-revalidate=300',
    );
    await expect(response.json()).resolves.toEqual({
      items: [],
      nextCursor: 'cursor-1',
    });
  });

  it('유효하지 않은 query는 400을 반환한다', async () => {
    const response = await GET(new Request('https://chaen.dev/api/projects?limit=0&locale=ko'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'limit은 1 이상이어야 합니다.',
    });
  });
});
