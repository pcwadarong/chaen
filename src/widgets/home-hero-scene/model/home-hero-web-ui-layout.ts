export type HomeHeroWebUiLayout = {
  readonly containerWidth: string;
  readonly overlayPadding: string;
  readonly showcaseOverlap: string;
};

/**
 * 히어로 오버레이와 실제 프로젝트 그리드의 배치를 맞추는 레이아웃 기준값입니다.
 */
export const homeHeroWebUiLayout: HomeHeroWebUiLayout = {
  containerWidth: 'min(1120px, calc(100% - 2rem))',
  overlayPadding: 'clamp(1rem, 3vw, 2rem)',
  showcaseOverlap: 'clamp(2.5rem, 6vh, 4rem)',
};
