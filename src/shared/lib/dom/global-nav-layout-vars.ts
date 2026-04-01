/**
 * 전역 네비게이션 레이아웃 계산에 사용하는 CSS 변수 이름입니다.
 *
 * 관리자 셸과 글로벌 네비게이션이 동일한 변수 계약을 공유해야 하므로
 * 문자열 리터럴을 각 위젯에 흩어두지 않고 공용 상수로 관리합니다.
 */
export const GLOBAL_NAV_HEIGHT_CSS_VAR = '--global-nav-height';

/**
 * 전역 네비게이션 숨김 상태에 따라 변경되는 CSS 변수 이름입니다.
 *
 * 값은 `0px` 또는 `calc(-1 * (var(--global-nav-height) + 0.5rem))` 형태로 관리됩니다.
 */
export const GLOBAL_NAV_OFFSET_CSS_VAR = '--global-nav-offset';
export const GLOBAL_NAV_DOCKED_TOP_CSS_VAR = '--global-nav-docked-top';

/**
 * 글로벌 네비게이션 레이아웃 변수를 기록해야 하는 DOM scope 목록을 반환합니다.
 *
 * `position: fixed`로 동작하는 관리자 모바일 네비는 `document.documentElement`의
 * CSS 변수를 읽어야 하고, app-frame 내부 viewport 기준 레이아웃은
 * `[data-app-scroll-viewport="true"]`의 변수를 읽어야 하므로 둘 다 동기화합니다.
 */
export const resolveGlobalNavLayoutVarScopes = () => {
  if (typeof document === 'undefined') return [] as HTMLElement[];

  const viewportScope =
    document.querySelector<HTMLElement>('[data-app-scroll-viewport="true"]') ?? null;

  return viewportScope && viewportScope !== document.documentElement
    ? [document.documentElement, viewportScope]
    : [document.documentElement];
};

/**
 * 전역 네비게이션 높이 CSS 변수 참조값을 반환합니다.
 */
export const buildGlobalNavHeightVar = () => `var(${GLOBAL_NAV_HEIGHT_CSS_VAR}, 0px)`;

/**
 * 전역 네비게이션 오프셋 CSS 변수 참조값을 반환합니다.
 */
export const buildGlobalNavOffsetVar = () => `var(${GLOBAL_NAV_OFFSET_CSS_VAR}, 0px)`;

/**
 * 글로벌 네비게이션 아래에 도킹되는 요소가 직접 읽는 CSS 변수 참조값을 반환합니다.
 *
 * 관리자 셸처럼 "보일 때는 네비 아래, 숨겨지면 0" 규칙만 필요할 때
 * 높이/오프셋을 다시 계산하지 않고 바로 사용할 수 있도록 분리합니다.
 */
export const buildGlobalNavDockedTopVar = () => `var(${GLOBAL_NAV_DOCKED_TOP_CSS_VAR}, 0px)`;

/**
 * 전역 네비게이션이 숨겨질 때 적용할 오프셋 계산식을 반환합니다.
 *
 * GlobalNav의 hidden 상태가 `translateY(calc(-100% - 0.5rem))`를 사용하므로,
 * 관리자 셸도 같은 거리만큼 이동해야 시각적으로 정확히 맞물립니다.
 */
export const buildHiddenGlobalNavOffsetValue = () =>
  `calc(-1 * (${buildGlobalNavHeightVar()} + 0.5rem))`;

/**
 * 글로벌 네비게이션 아래에 고정되는 요소의 `top` 계산식을 반환합니다.
 */
export const buildGlobalNavDockedTopValue = () => buildGlobalNavDockedTopVar();

/**
 * 글로벌 네비게이션 아래에 배치되는 본문 영역의 `padding-top` 계산식을 반환합니다.
 */
export const buildGlobalNavDockedPaddingTopValue = (extraOffset = '0rem') =>
  `calc(${buildGlobalNavDockedTopValue()} + ${extraOffset})`;
