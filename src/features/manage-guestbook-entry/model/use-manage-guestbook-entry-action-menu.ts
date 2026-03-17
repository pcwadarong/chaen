'use client';

import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

const MOBILE_LONG_PRESS_MS = 420;

type UseManageGuestbookEntryActionMenuParams = {
  enabled: boolean;
};

type BubbleLongPressHandlers = Pick<
  React.HTMLAttributes<HTMLElement>,
  'onContextMenu' | 'onPointerCancel' | 'onPointerDown' | 'onPointerLeave' | 'onPointerUp'
>;

/**
 * 모바일/터치 환경에서 long press 액션 메뉴를 사용할지 판별합니다.
 */
const canUseLongPressActionMenu = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;

  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(max-width: 720px)').matches
  );
};

/**
 * 방명록 버블에서 kebab 버튼과 long press로 같은 액션 메뉴를 열 수 있게 상태와 핸들러를 제공합니다.
 */
export const useManageGuestbookEntryActionMenu = ({
  enabled,
}: UseManageGuestbookEntryActionMenuParams): {
  isOpen: boolean;
  longPressHandlers: BubbleLongPressHandlers;
  setIsOpen: (nextOpen: boolean) => void;
} => {
  const [isOpen, setIsOpen] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);

  /**
   * 예약된 long press 타이머를 정리합니다.
   */
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current === null) return;

    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }, []);

  useEffect(() => clearLongPressTimer, [clearLongPressTimer]);

  const longPressHandlers: BubbleLongPressHandlers = {
    onContextMenu: event => {
      if (enabled && canUseLongPressActionMenu()) event.preventDefault();
    },
    onPointerCancel: clearLongPressTimer,
    onPointerDown: event => {
      if (!enabled || event.pointerType === 'mouse' || !canUseLongPressActionMenu()) return;

      clearLongPressTimer();
      longPressTimerRef.current = window.setTimeout(() => {
        setIsOpen(true);
      }, MOBILE_LONG_PRESS_MS);
    },
    onPointerLeave: clearLongPressTimer,
    onPointerUp: clearLongPressTimer,
  };

  return {
    isOpen,
    longPressHandlers,
    setIsOpen,
  };
};
