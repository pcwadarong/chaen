import { type RefObject, useEffect, useRef } from 'react';

import { getFocusableElements } from '@/shared/lib/a11y/get-focusable-elements';

type UseDialogFocusManagementParams = {
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  isEnabled: boolean;
  onEscape: () => void;
};

/**
 * 다이얼로그/모달의 공통 포커스 관리 규칙을 제공합니다.
 * 열릴 때 초기 포커스를 이동하고, `Tab` 순환을 강제하며, 닫힐 때 이전 포커스를 복원합니다.
 */
export const useDialogFocusManagement = ({
  containerRef,
  initialFocusRef,
  isEnabled,
  onEscape,
}: UseDialogFocusManagementParams) => {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isEnabled) return;

    // 다이얼로그가 열릴 때 현재 활성 요소를 저장하여 닫힐 때 복원할 수 있도록 함
    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // 다이얼로그가 열릴 때 초기 포커스 요소로 이동
    const requestFocus = () => {
      const container = containerRef.current;
      if (!container) return;

      // 초기 포커스 요소가 없거나 유효하지 않으면 다이얼로그 내의 첫 번째 포커스 가능한 요소로 이동
      const fallbackTarget =
        initialFocusRef?.current ?? getFocusableElements(container)[0] ?? container;
      fallbackTarget.focus();
    };

    const rafId = window.requestAnimationFrame(requestFocus);

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape();
        return;
      }

      if (event.key !== 'Tab') return;

      const container = containerRef.current;
      if (!container) return;

      // 다이얼로그 내의 포커스 가능한 요소들을 가져옴
      const focusableElements = getFocusableElements(container);

      // 포커스 가능한 요소가 없으면 다이얼로그 자체에 포커스를 유지
      if (focusableElements.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      // 현재 활성 요소의 인덱스를 찾음
      const activeElement = document.activeElement as HTMLElement | null;
      const activeIndex = activeElement ? focusableElements.indexOf(activeElement) : -1;

      // Shift+Tab: 첫 번째 요소에서 뒤로 이동 시 마지막 요소로
      if (event.shiftKey && (activeIndex <= 0 || activeIndex === -1)) {
        event.preventDefault();
        focusableElements[focusableElements.length - 1]?.focus();
        return;
      }

      // Tab: 마지막 요소에서 앞으로 이동 시 첫 번째 요소로
      if (!event.shiftKey && (activeIndex === -1 || activeIndex === focusableElements.length - 1)) {
        event.preventDefault();
        focusableElements[0]?.focus();
      }
    };

    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', handleKeydown);
      // 모달이 닫힐 때 이전 활성 요소로 포커스를 복원
      previousActiveElementRef.current?.focus();
    };
  }, [containerRef, initialFocusRef, isEnabled, onEscape]);
};
