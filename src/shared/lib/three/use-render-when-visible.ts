'use client';

import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

const VISIBILITY_INTERSECTION_THRESHOLD = 0;
const VISIBILITY_INTERSECTION_ROOT_MARGIN = '10%';

/**
 * Canvas가 실제로 화면에 보이지 않는 동안 렌더 루프를 멈춰 불필요한 GPU/CPU 비용을 없앱니다.
 * `frameloop="demand"`는 캐릭터 mixer/gsap 티커/OrbitControls 댐핑이 상시 구동돼
 * 매 프레임 invalidate로 퇴화하므로 채택하지 않고, 두 Canvas 모두 기본값인
 * `frameloop="always"`을 유지한 채 가시성에 따라 on/off만 토글합니다.
 * 가시성은 두 신호로 판단합니다: (1) `gl.domElement`에 대한 IntersectionObserver(뷰포트 교차),
 * (2) `document.visibilitychange`(브라우저 탭 백그라운드). 둘 중 하나라도 "숨김"이면 즉시
 * `setFrameloop('never')`로 정지하고, 두 신호가 **모두** "보임"으로 돌아온 순간에만
 * `setFrameloop('always')`로 재개한 뒤 프레임 점프를 막기 위해 `invalidate()`를 1회 호출합니다.
 * 이렇게 두 소스를 각각 추적해야 "탭은 백그라운드인데 스크롤상 캔버스는 보이는" 또는
 * 그 반대의 경우에 잘못 재개되지 않습니다.
 * Canvas 내부에서 마운트해야 하며(useThree 사용), 화면에는 아무것도 그리지 않습니다.
 */
export const RenderWhenVisible = () => {
  const setFrameloop = useThree(state => state.setFrameloop);
  const gl = useThree(state => state.gl);
  const invalidate = useThree(state => state.invalidate);

  useEffect(() => {
    const canvasElement = gl.domElement;
    let isIntersecting = true;
    let isDocumentVisible = document.visibilityState !== 'hidden';

    const applyVisibility = () => {
      if (isIntersecting && isDocumentVisible) {
        setFrameloop('always');
        invalidate();
        return;
      }

      setFrameloop('never');
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
  }, [gl, invalidate, setFrameloop]);

  return null;
};
