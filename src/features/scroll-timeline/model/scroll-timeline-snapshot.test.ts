// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { getScrollTimelineSnapshot } from '@/features/scroll-timeline/model/scroll-timeline-snapshot';

const DESKTOP_INITIAL_POSITION = [0, 1, 9] as const;

describe('getScrollTimelineSnapshot', () => {
  it('초기 스크롤 구간에서는 blackout과 web UI overlay가 모두 비활성화되어야 한다', () => {
    const startSnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0,
    });
    const zoomSnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0.25,
    });

    expect(startSnapshot.blackoutOpacity).toBe(0);
    expect(zoomSnapshot.blackoutOpacity).toBe(0);
    expect(startSnapshot.webUiOpacity).toBe(0);
    expect(zoomSnapshot.webUiOpacity).toBe(0);
    expect(zoomSnapshot.isScrollDriven).toBe(true);
    expect(zoomSnapshot.progress).toBe(0.25);
    expect(zoomSnapshot.cameraPosition[2]).toBeGreaterThan(4);
  });

  it('줌 종료 지점과 스핀 시작 지점의 카메라 높이는 이어져야 한다', () => {
    const zoomEndSnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0.25,
    });
    const spinStartSnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0.2501,
    });

    expect(spinStartSnapshot.cameraPosition[1]).toBeCloseTo(zoomEndSnapshot.cameraPosition[1], 3);
  });

  it('블랙아웃 IN 이후 클로즈업 구간에서는 overlay가 걷히고 마지막에 monitor overlay가 보여야 한다', () => {
    const blackoutSnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0.54,
    });
    const closeupSnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0.72,
    });
    const overlaySnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0.92,
    });

    expect(blackoutSnapshot.blackoutOpacity).toBeGreaterThan(0);
    expect(blackoutSnapshot.isCloseupCostumeHidden).toBe(false);
    expect(closeupSnapshot.blackoutOpacity).toBeLessThan(blackoutSnapshot.blackoutOpacity);
    expect(closeupSnapshot.isCloseupCostumeHidden).toBe(true);
    expect(overlaySnapshot.isMonitorOverlayVisible).toBe(true);
    expect(overlaySnapshot.isCloseupCostumeHidden).toBe(true);
    expect(overlaySnapshot.webUiOpacity).toBeGreaterThan(0);
  });
});
