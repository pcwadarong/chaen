'use client';

import { useEffect, useState } from 'react';

const VISIBILITY_INTERSECTION_THRESHOLD = 0;
const VISIBILITY_INTERSECTION_ROOT_MARGIN = '10%';

export type CanvasFrameloop = 'always' | 'never';

/**
 * Canvas가 실제로 화면에 보이는 동안에만 렌더 루프를 돌리기 위한 `frameloop` 값을 계산합니다.
 * 반환값은 반드시 `<Canvas frameloop={...}>` prop으로 전달해야 합니다.
 *
 * 왜 명령형 `setFrameloop('never')`가 아니라 제어형 prop인가:
 * `<Canvas>`는 리렌더될 때마다 `frameloop` prop을 스토어에 다시 적용하며, prop이 없으면
 * 기본값 `'always'`로 되돌립니다(react-three-fiber `configure`는 deps 없는 layout effect).
 * 따라서 Canvas 내부 컴포넌트에서 `setFrameloop('never')`를 명령형으로 호출하면
 * 다음 리렌더 한 번에 곧바로 `'always'`로 덮어써집니다 — 화면 밖으로 나간 캔버스가
 * 계속 도는 원인이었습니다. 값을 prop으로 "제어"하면 리렌더가 일어나도 의도한 상태가 유지됩니다.
 *
 * 가시성은 두 신호로 판단합니다: (1) 캔버스 요소에 대한 IntersectionObserver(뷰포트 교차),
 * (2) `document.visibilitychange`(브라우저 탭 백그라운드). 둘 중 하나라도 "숨김"이면 `'never'`,
 * 두 신호가 **모두** "보임"일 때만 `'always'`입니다. 두 소스를 각각 추적해야
 * "탭은 백그라운드인데 스크롤상 캔버스는 보이는" 또는 그 반대의 경우에 잘못 재개되지 않습니다.
 *
 * `frameloop`을 `'demand'`가 아니라 `'always'`/`'never'` 토글로 두는 이유: 캐릭터 mixer·gsap 티커·
 * OrbitControls 댐핑이 상시 구동돼 `'demand'`는 매 프레임 invalidate로 퇴화하기 때문입니다.
 *
 * @param canvasElement Canvas의 `onCreated`에서 얻은 `gl.domElement`. 아직 준비 전이면 `null`.
 */
export const useCanvasVisibilityFrameloop = (
  canvasElement: HTMLCanvasElement | null,
): CanvasFrameloop => {
  const [frameloop, setFrameloop] = useState<CanvasFrameloop>('always');

  useEffect(() => {
    if (!canvasElement) return;

    let isIntersecting = true;
    let isDocumentVisible = document.visibilityState !== 'hidden';

    const applyVisibility = () => {
      setFrameloop(isIntersecting && isDocumentVisible ? 'always' : 'never');
    };

    const intersectionObserver = new IntersectionObserver(
      entries => {
        isIntersecting = entries[0]?.isIntersecting ?? false;
        applyVisibility();
      },
      {
        rootMargin: VISIBILITY_INTERSECTION_ROOT_MARGIN,
        threshold: VISIBILITY_INTERSECTION_THRESHOLD,
      },
    );

    const handleDocumentVisibilityChange = () => {
      isDocumentVisible = document.visibilityState !== 'hidden';
      applyVisibility();
    };

    intersectionObserver.observe(canvasElement);
    document.addEventListener('visibilitychange', handleDocumentVisibilityChange);

    return () => {
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', handleDocumentVisibilityChange);
    };
  }, [canvasElement]);

  return frameloop;
};
