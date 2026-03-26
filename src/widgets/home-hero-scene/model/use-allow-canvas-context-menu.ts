'use client';

import { useEffect } from 'react';

/**
 * three OrbitControls가 차단하는 우클릭 기본 메뉴를 캔버스에서 다시 허용합니다.
 *
 * OrbitControls는 `contextmenu`에서 `preventDefault()`를 호출하므로,
 * 캡처 단계에서 이벤트 전파를 먼저 끊어 브라우저 기본 메뉴가 유지되도록 합니다.
 */
export const useAllowCanvasContextMenu = (canvasElement: HTMLCanvasElement | null) => {
  useEffect(() => {
    if (!canvasElement) return;

    const handleContextMenuCapture = (event: MouseEvent) => {
      event.stopImmediatePropagation();
    };

    canvasElement.addEventListener('contextmenu', handleContextMenuCapture, true);

    return () => {
      canvasElement.removeEventListener('contextmenu', handleContextMenuCapture, true);
    };
  }, [canvasElement]);
};
