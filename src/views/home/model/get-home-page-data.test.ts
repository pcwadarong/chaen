import { vi } from 'vitest';

import { getProjects } from '@/entities/project/api/list/get-projects';
import { getHomePageData } from '@/views/home/model/get-home-page-data';

vi.mock('@/entities/project/api/detail/get-projects', () => ({
  getProjects: vi.fn(),
}));

describe('getHomePageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('홈 프리뷰 프로젝트 3개를 조회해 items로 반환한다', async () => {
    vi.mocked(getProjects).mockResolvedValue({
      items: [
        {
          id: 'project-1',
          title: 'p1',
          description: 'd1',
          thumbnail_url: null,
          publish_at: '2026-03-01T00:00:00.000Z',
          slug: 'project-1',
        },
      ],
      nextCursor: null,
    });

    const data = await getHomePageData({ locale: 'ko' });

    expect(getProjects).toHaveBeenCalledWith({ locale: 'ko', limit: 3 });
    expect(data.items).toHaveLength(1);
  });

  it('프로젝트 조회 실패 시 빈 items로 폴백한다', async () => {
    vi.mocked(getProjects).mockRejectedValue(new Error('temporary failure'));

    const data = await getHomePageData({ locale: 'ko' });

    expect(data).toEqual({
      items: [],
    });
  });
});
