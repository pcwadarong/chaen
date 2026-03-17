import { homeHeroCameraMotion } from '@/widgets/home-hero-scene/ui/home-hero-camera-motion';

describe('homeHeroCameraMotion', () => {
  it('모니터 포커스를 위한 180도 회전 값을 제공한다', () => {
    expect(homeHeroCameraMotion.initialRotationY).toBe(0);
    expect(homeHeroCameraMotion.finalRotationY).toBe(Math.PI);
  });

  it('스크롤이 진행될수록 카메라가 더 가까워지도록 설정한다', () => {
    expect(homeHeroCameraMotion.intermediateCameraOffset[2]).toBeLessThan(
      homeHeroCameraMotion.initialCameraOffset[2],
    );
    expect(homeHeroCameraMotion.finalCameraOffset[2]).toBeLessThan(
      homeHeroCameraMotion.intermediateCameraOffset[2],
    );
    expect(homeHeroCameraMotion.webUiFadeStart).toBeGreaterThan(
      homeHeroCameraMotion.canvasFadeStart,
    );
  });
});
