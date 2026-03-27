type HomeHeroViewportMetricsInput = Readonly<{
  navHeight: number;
  viewportHeight: number;
}>;

type HomeHeroViewportMetrics = Readonly<{
  availableHeight: number;
  scrollSectionHeight: number;
  viewportHeight: number;
}>;

/**
 * 홈 히어로와 contact가 공유하는 viewport 관련 높이 값을 계산합니다.
 */
export const getHomeHeroViewportMetrics = ({
  navHeight,
  viewportHeight,
}: HomeHeroViewportMetricsInput): HomeHeroViewportMetrics => {
  const safeViewportHeight = Math.max(viewportHeight, 0);
  const safeNavHeight = Math.max(navHeight, 0);
  const availableHeight = Math.max(safeViewportHeight - safeNavHeight, 0);
  const scrollSectionHeight = Math.max(availableHeight * 4 + safeNavHeight, 0);

  return {
    availableHeight,
    scrollSectionHeight,
    viewportHeight: safeViewportHeight,
  };
};
