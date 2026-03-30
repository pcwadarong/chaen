/* @vitest-environment node */

import { vi } from 'vitest';

import { listPhotoFiles } from '@/entities/hero-photo/api/list-photo-files';
import { getHomePageData } from '@/views/home/model/get-home-page-data';

vi.mock('@/entities/hero-photo/api/list-photo-files', () => ({
  listPhotoFiles: vi.fn(),
}));

describe('getHomePageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('기본 홈 데이터 조회가 성공할 때, getHomePageData는 hero photo 목록과 locale을 반환해야 한다', async () => {
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

    expect(listPhotoFiles).toHaveBeenCalled();
    expect(data.photoItems).toEqual([
      {
        alt: 'hero-photo.jpg',
        src: 'https://example.com/hero-photo.jpg',
      },
    ]);
    expect(data.locale).toBe('ko');
  });

  it('hero photo 조회가 실패할 때, getHomePageData는 빈 배열 photoItems로 폴백해야 한다', async () => {
    vi.mocked(listPhotoFiles).mockRejectedValue(new Error('photo failure'));

    const data = await getHomePageData({ locale: 'ko' });

    expect(data).toEqual({
      locale: 'ko',
      photoItems: [],
    });
  });
});
