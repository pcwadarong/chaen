/**
 * 앱 프레임과 주요 콘텐츠 컨테이너가 공유하는 가로 폭 기준값입니다.
 * breakpoint와 달리 "언제 레이아웃을 바꾸는가"가 아니라 "어디까지 넓어질 수 있는가"를 정의합니다.
 * Panda token과 런타임 breakpoint 해석이 모두 이 값을 source of truth로 참조합니다.
 */
export const LAYOUT_WIDTHS = {
  appFrameMax: 1280,
  contentCompact: 820,
  contentDefault: 980,
  contentWide: 1120,
} as const;
