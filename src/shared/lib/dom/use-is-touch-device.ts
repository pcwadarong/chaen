'use client';

import { useEffect, useState } from 'react';

const TOUCH_POINTER_MEDIA_QUERY = '(pointer: coarse)';

/**
 * 현재 런타임 입력 장치가 coarse pointer 중심인지 판별합니다.
 * breakpoint가 아니라 실제 포인터 특성을 기준으로 hover 비활성 환경을 감지할 때 사용합니다.
 */
export const useIsTouchDevice = (): boolean => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQueryList = window.matchMedia(TOUCH_POINTER_MEDIA_QUERY);
    setIsTouchDevice(mediaQueryList.matches);

    /**
     * coarse pointer 여부가 바뀌면 현재 입력 장치 상태를 다시 동기화합니다.
     */
    const handleChange = (event: MediaQueryListEvent) => setIsTouchDevice(event.matches);
    mediaQueryList.addEventListener('change', handleChange);

    return () => mediaQueryList.removeEventListener('change', handleChange);
  }, []);

  return isTouchDevice;
};
