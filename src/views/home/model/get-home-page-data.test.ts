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

  it('기본 홈 데이터 조회가 성공할 때, getHomePageData가 넘긴 promise는 hero photo 목록으로 resolve되어야 한다', async () => {
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

    const data = getHomePageData({ locale: 'ko' });

    expect(listPhotoFiles).toHaveBeenCalled();
    await expect(data.photoItemsPromise).resolves.toEqual([
      {
        alt: 'hero-photo.jpg',
        src: 'https://example.com/hero-photo.jpg',
      },
    ]);
    expect(data.locale).toBe('ko');
  });

  it('hero photo 조회가 실패할 때, getHomePageData가 넘긴 promise는 reject되지 않고 빈 배열로 resolve되어야 한다', async () => {
    vi.mocked(listPhotoFiles).mockRejectedValue(new Error('photo failure'));

    const data = getHomePageData({ locale: 'ko' });

    expect(data.locale).toBe('ko');
    await expect(data.photoItemsPromise).resolves.toEqual([]);
  });

  it('라우트가 await하지 않아도 되도록, getHomePageData는 storage 응답을 기다리지 않고 즉시 반환해야 한다', () => {
    vi.mocked(listPhotoFiles).mockReturnValue(new Promise(() => {}));

    const data = getHomePageData({ locale: 'ko' });

    expect(data.locale).toBe('ko');
    expect(data.photoItemsPromise).toBeInstanceOf(Promise);
  });
});
