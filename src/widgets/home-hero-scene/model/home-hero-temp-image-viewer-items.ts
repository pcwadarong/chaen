type HomeHeroTempImageViewerItem = Readonly<{
  alt: string;
  src: string;
}>;

/**
 * camera click 임시 연결에 사용하는 기본 이미지 목록입니다.
 * 이후 DB/storage가 준비되면 이 상수를 실제 조회 데이터로 교체합니다.
 */
export const HOME_HERO_TEMP_IMAGE_VIEWER_ITEMS: HomeHeroTempImageViewerItem[] = [
  {
    alt: 'Temporary camera image 1',
    src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  },
  {
    alt: 'Temporary camera image 2',
    src: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    alt: 'Temporary camera image 3',
    src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  },
];
