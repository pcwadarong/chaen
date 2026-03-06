const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 컨테이너 내부에서 키보드 포커스 이동이 가능한 요소 목록을 반환합니다.
 * `hidden` 또는 `aria-hidden="true"`인 요소는 제외합니다.
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    element => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true',
  );
