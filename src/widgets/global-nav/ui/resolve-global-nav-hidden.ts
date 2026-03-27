const NAV_VISIBILITY_DELTA_THRESHOLD = 6;
const NAV_MIN_VISIBLE_SCROLL_TOP = 8;

type ResolveGlobalNavHiddenParams = {
  currentScrollY: number;
  headerHeight: number;
  lastScrollY: number;
  previousHidden: boolean;
};

/**
 * 현재 스크롤 위치와 직전 위치를 비교해 전역 네비게이션 숨김 여부를 계산합니다.
 * 아래로 충분히 스크롤하면 숨기고, 위로 충분히 스크롤하면 다시 표시합니다.
 * 사용자가 헤더 높이만큼 내려가기 전까지는 네비게이션을 숨기지 않아 첫 화면 진입부의 덜컹거림을 줄입니다.
 *
 */
export const resolveGlobalNavHidden = ({
  currentScrollY,
  headerHeight,
  lastScrollY,
  previousHidden,
}: ResolveGlobalNavHiddenParams) => {
  const delta = currentScrollY - lastScrollY;
  // 헤더 높이 이내에서는 항상 보이도록 처리합니다.
  const visibleSafeZone = Math.max(headerHeight, NAV_MIN_VISIBLE_SCROLL_TOP);

  if (currentScrollY <= visibleSafeZone) return false;
  // 안전 구간을 지난 뒤에는 스크롤 방향과 이동량으로만 판단합니다.
  if (delta >= NAV_VISIBILITY_DELTA_THRESHOLD) return true;
  if (delta <= -NAV_VISIBILITY_DELTA_THRESHOLD) return false;

  return previousHidden;
};
