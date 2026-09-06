/* @vitest-environment jsdom */

import { act, renderHook } from '@testing-library/react';

import type { HomeHeroImageViewerItem } from '@/widgets/home-hero-scene/model/home-hero-image-viewer-item';
import { useHomeHeroPhotoItems } from '@/widgets/home-hero-scene/model/use-home-hero-photo-items';

const PHOTO_ITEMS: HomeHeroImageViewerItem[] = [
  { alt: 'Hero photo 1', src: 'https://example.com/photo-1.jpg' },
];

describe('useHomeHeroPhotoItems', () => {
  it('promise가 아직 resolve되지 않았을 때, 캔버스 부팅을 막지 않도록 빈 목록을 즉시 반환해야 한다', () => {
    const { result } = renderHook(() =>
      useHomeHeroPhotoItems(new Promise<HomeHeroImageViewerItem[]>(() => {})),
    );

    expect(result.current).toEqual([]);
  });

  it('promise가 resolve되면, 조회된 hero photo 목록으로 교체되어야 한다', async () => {
    const { result } = renderHook(() => useHomeHeroPhotoItems(Promise.resolve(PHOTO_ITEMS)));

    await act(async () => {});

    expect(result.current).toEqual(PHOTO_ITEMS);
  });

  it('promise가 resolve되기 전에 언마운트되면, 언마운트된 컴포넌트에 상태를 반영하지 않아야 한다', async () => {
    let resolvePhotoItems: (items: HomeHeroImageViewerItem[]) => void = () => {};
    const photoItemsPromise = new Promise<HomeHeroImageViewerItem[]>(resolve => {
      resolvePhotoItems = resolve;
    });
    const { result, unmount } = renderHook(() => useHomeHeroPhotoItems(photoItemsPromise));

    unmount();
    await act(async () => {
      resolvePhotoItems(PHOTO_ITEMS);
    });

    expect(result.current).toEqual([]);
  });
});
