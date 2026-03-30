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
 * 값은 `0px` 또는 `calc(-1 * var(--global-nav-height))` 형태로 관리됩니다.
 */
export const GLOBAL_NAV_OFFSET_CSS_VAR = '--global-nav-offset';

/**
 * 전역 네비게이션 높이 CSS 변수 참조값을 반환합니다.
 */
export const buildGlobalNavHeightVar = () => `var(${GLOBAL_NAV_HEIGHT_CSS_VAR}, 0px)`;

/**
 * 전역 네비게이션 오프셋 CSS 변수 참조값을 반환합니다.
 */
export const buildGlobalNavOffsetVar = () => `var(${GLOBAL_NAV_OFFSET_CSS_VAR}, 0px)`;

/**
 * 전역 네비게이션이 숨겨질 때 적용할 오프셋 계산식을 반환합니다.
 */
export const buildHiddenGlobalNavOffsetValue = () => `calc(-1 * ${buildGlobalNavHeightVar()})`;

/**
 * 글로벌 네비게이션 아래에 고정되는 요소의 `top` 계산식을 반환합니다.
 */
export const buildGlobalNavDockedTopValue = () =>
  `calc(${buildGlobalNavHeightVar()} + ${buildGlobalNavOffsetVar()})`;

/**
 * 글로벌 네비게이션 아래에 배치되는 본문 영역의 `padding-top` 계산식을 반환합니다.
 */
export const buildGlobalNavDockedPaddingTopValue = (extraOffset = '0rem') =>
  `calc(${buildGlobalNavDockedTopValue()} + ${extraOffset})`;
