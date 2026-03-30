/* @vitest-environment jsdom */

import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { SCENE_VIEWPORT_MODE } from '@/entities/scene/model/breakpointConfig';
import { useHomeHeroSceneTransition } from '@/widgets/home-hero-scene/model/use-home-hero-scene-transition';

const useScrollTimelineMock = vi.fn();
const usePrefersReducedMotionMock = vi.fn();

vi.mock('@react-three/fiber', () => ({
  useThree: () => ({
    camera: {
      far: 0,
      fov: 0,
      lookAt: vi.fn(),
      near: 0,
      position: {
        set: vi.fn(),
      },
      updateMatrixWorld: vi.fn(),
      updateProjectionMatrix: vi.fn(),
    },
  }),
}));

vi.mock('@/features/scroll-timeline/model/use-scroll-timeline', () => ({
  useScrollTimeline: (args: unknown) => useScrollTimelineMock(args),
}));

vi.mock('@/shared/lib/dom/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => usePrefersReducedMotionMock(),
}));

describe('useHomeHeroSceneTransition', () => {
  beforeEach(() => {
    usePrefersReducedMotionMock.mockReturnValue(false);
    useScrollTimelineMock.mockReturnValue({
      isCloseupCostumeHidden: false,
      isScrollDriven: false,
      isSequenceActive: false,
      monitorOverlayOpacity: 0,
      progress: 0,
    });
  });

  it('wide viewport라도 reduced motion이 켜져 있을 때, useHomeHeroSceneTransition은 scroll timeline을 비활성화해야 한다', () => {
    usePrefersReducedMotionMock.mockReturnValue(true);

    renderHook(() =>
      useHomeHeroSceneTransition({
        blackoutOverlayRef: { current: null },
        sceneLayout: {
          bassPosition: [0, 0, 0],
          bassRotation: [0, 0, 0],
          camera: {
            fov: 42,
            lookAt: [0, 0, 0],
            maxAzimuthAngle: 0.5,
            maxDistance: 10,
            maxPolarAngle: 1.2,
            minAzimuthAngle: -0.5,
            minDistance: 4,
            minPolarAngle: 0.8,
            position: [0, 0, 8],
          },
          tablePosition: [0, 0, 0],
          tableRotation: [0, 0, 0],
        },
        sceneViewportMode: SCENE_VIEWPORT_MODE.wide,
        triggerRef: { current: null },
        webUiRef: { current: null },
      }),
    );

    expect(useScrollTimelineMock).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });
});
