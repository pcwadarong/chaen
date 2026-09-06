'use client';

import { useEffect, useState } from 'react';

import type { HomeHeroImageViewerItem } from '@/widgets/home-hero-scene/model/home-hero-image-viewer-item';

const EMPTY_PHOTO_ITEMS: HomeHeroImageViewerItem[] = [];

/**
 * 서버에서 시작한 hero photo 조회를 히어로 렌더를 막지 않고 이어받습니다.
 *
 * `use()`로 읽으면 목록이 도착할 때까지 히어로 전체가 suspend되어 캔버스 부팅이 그만큼
 * 밀립니다. 사진은 첫 3D 프레임에 필요한 값이 아닙니다 — 액자 텍스처는 `SceneProp`이
 * `TextureLoader`로 어차피 비동기로 올리고 없는 동안은 빈 화면으로 렌더되며, 이미지
 * 뷰어는 상호작용 이후에만 열립니다. 그래서 도착 전에는 빈 목록을 돌려주고 캔버스를
 * 먼저 띄웁니다.
 *
 * @param photoItemsPromise 서버 컴포넌트가 넘긴 hero photo 목록 promise입니다.
 * 조회 실패는 `getHomePageData`가 빈 배열로 흡수하므로 reject되지 않습니다.
 * @returns 도착 전에는 빈 배열, 도착 후에는 조회된 hero photo 목록입니다.
 */
export const useHomeHeroPhotoItems = (
  photoItemsPromise: Promise<HomeHeroImageViewerItem[]>,
): HomeHeroImageViewerItem[] => {
  const [photoItems, setPhotoItems] = useState<HomeHeroImageViewerItem[]>(EMPTY_PHOTO_ITEMS);

  useEffect(() => {
    let isActive = true;

    void photoItemsPromise.then(items => {
      if (isActive) setPhotoItems(items);
    });

    return () => {
      isActive = false;
    };
  }, [photoItemsPromise]);

  return photoItems;
};
