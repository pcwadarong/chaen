import { vi } from 'vitest';

import { getProjects } from '@/entities/project/api/get-projects';

import { getHomePageData } from './get-home-page-data';

vi.mock('@/entities/project/api/get-projects', () => ({
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
          content: 'c1',
          thumbnail_url: null,
          gallery_urls: null,
          tags: [],
          created_at: '2026-03-01T00:00:00.000Z',
        },
      ],
      nextCursor: null,
    });

    const data = await getHomePageData({ locale: 'ko' });

    expect(getProjects).toHaveBeenCalledWith({ locale: 'ko', limit: 3 });
    expect(data.items).toHaveLength(1);
  });
});
