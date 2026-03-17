'use client';

import { useEffect, useState } from 'react';

/**
 * 사용자가 실제로 한 번이라도 스크롤 의도를 보인 뒤에만 자동 추가 로드를 허용합니다.
 *
 * 목록 첫 진입 직후 sentinel이 바로 viewport 안에 들어와도 다음 페이지를 곧바로 요청하지 않도록
 * `wheel`, `touchmove`, `keydown`, `scroll` 이벤트 중 하나가 발생할 때까지 gate를 닫아 둡니다.
 */
export const useAutoLoadAfterScroll = () => {
  const [isAutoLoadEnabled, setIsAutoLoadEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.scrollY > 0) {
      setIsAutoLoadEnabled(true);
      return;
    }

    const enableAutoLoad = () => {
      setIsAutoLoadEnabled(true);
    };

    const listenerOptions: AddEventListenerOptions = {
      once: true,
      passive: true,
    };

    window.addEventListener('keydown', enableAutoLoad, listenerOptions);
    window.addEventListener('scroll', enableAutoLoad, listenerOptions);
    window.addEventListener('touchmove', enableAutoLoad, listenerOptions);
    window.addEventListener('wheel', enableAutoLoad, listenerOptions);

    return () => {
      window.removeEventListener('keydown', enableAutoLoad);
      window.removeEventListener('scroll', enableAutoLoad);
      window.removeEventListener('touchmove', enableAutoLoad);
      window.removeEventListener('wheel', enableAutoLoad);
    };
  }, []);

  return isAutoLoadEnabled;
};
