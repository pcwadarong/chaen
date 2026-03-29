const buildMinWidthMediaQuery = (width: number): `(min-width: ${number}px)` =>
  `(min-width: ${width}px)`;

const buildMaxWidthMediaQuery = (width: number): `(max-width: ${number}px)` =>
  `(max-width: ${width}px)`;

/**
 * 앱 전반에서 공유하는 canonical viewport 구간입니다.
 * 화면별 레이아웃은 이 값을 직접 조합해 해석하고, 전역 config에는 별도 alias를 두지 않습니다.
 */
export const VIEWPORT_BREAKPOINTS = {
  mobileSmallMax: 480,
  mobileLargeMax: 768,
  tabletMax: 960,
  desktopMin: 961,
  desktopMax: 1280,
} as const;

/**
 * 런타임 `matchMedia`와 Panda custom condition이 같이 참조하는 canonical media query 문자열입니다.
 */
export const viewportMediaQuery = {
  mobileSmallDown: buildMaxWidthMediaQuery(VIEWPORT_BREAKPOINTS.mobileSmallMax),
  mobileLargeUp: buildMinWidthMediaQuery(VIEWPORT_BREAKPOINTS.mobileSmallMax + 1),
  mobileLargeDown: buildMaxWidthMediaQuery(VIEWPORT_BREAKPOINTS.mobileLargeMax),
  tabletUp: buildMinWidthMediaQuery(VIEWPORT_BREAKPOINTS.mobileLargeMax + 1),
  tabletDown: buildMaxWidthMediaQuery(VIEWPORT_BREAKPOINTS.tabletMax),
  desktopUp: buildMinWidthMediaQuery(VIEWPORT_BREAKPOINTS.desktopMin),
  desktopDown: buildMaxWidthMediaQuery(VIEWPORT_BREAKPOINTS.desktopMax),
} as const;

/**
 * `next/image`의 `sizes` 속성에서 재사용할 responsive sizes 문자열입니다.
 */
export const viewportImageSizes = {
  imageSourceField: `${viewportMediaQuery.mobileSmallDown} 100vw, ${VIEWPORT_BREAKPOINTS.mobileSmallMax}px`,
} as const;

/**
 * 씬 전용 레이아웃이 참조하는 세로 높이 기준값입니다.
 * 특히 desktop이지만 높이가 짧은 경우 별도 compact 레이아웃으로 전환할 때 사용합니다.
 */
export const SCENE_LAYOUT_HEIGHT_THRESHOLDS = {
  contactCompactDesktopMax: 800,
} as const;
