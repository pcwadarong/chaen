/* @vitest-environment node */

import { vi } from 'vitest';

import { listPhotoFiles } from '@/entities/hero-photo/api/list-photo-files';
import { getProjects } from '@/entities/project/api/list/get-projects';
import { getHomePageData } from '@/views/home/model/get-home-page-data';

vi.mock('@/entities/hero-photo/api/list-photo-files', () => ({
  listPhotoFiles: vi.fn(),
}));

vi.mock('@/entities/project/api/list/get-projects', () => ({
  getProjects: vi.fn(),
}));

describe('getHomePageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('기본 홈 데이터 조회가 성공할 때, getHomePageData는 프리뷰 프로젝트와 hero photo 목록을 함께 반환해야 한다', async () => {
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
    vi.mocked(listPhotoFiles).mockResolvedValue([
      {
        createdAt: '2026-03-27T00:00:00.000Z',
        fileName: 'hero-photo.jpg',
        filePath: 'hero-photo.jpg',
        mimeType: 'image/jpeg',
        publicUrl: 'https://example.com/hero-photo.jpg',
        size: 120_000,
      },
    ]);

    const data = await getHomePageData({ locale: 'ko' });

    expect(getProjects).toHaveBeenCalledWith({ locale: 'ko', limit: 3 });
    expect(listPhotoFiles).toHaveBeenCalled();
    expect(data.items).toHaveLength(1);
    expect(data.photoItems).toEqual([
      {
        alt: 'hero-photo.jpg',
        src: 'https://example.com/hero-photo.jpg',
      },
    ]);
  });

  it('프로젝트 또는 hero photo 조회가 실패할 때, getHomePageData는 빈 배열로 폴백해야 한다', async () => {
    vi.mocked(getProjects).mockRejectedValue(new Error('temporary failure'));
    vi.mocked(listPhotoFiles).mockRejectedValue(new Error('photo failure'));

    const data = await getHomePageData({ locale: 'ko' });

    expect(data).toEqual({
      items: [],
      photoItems: [],
    });
  });
});
