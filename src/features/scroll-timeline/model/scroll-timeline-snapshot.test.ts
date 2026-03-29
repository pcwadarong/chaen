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

  it('monitor overlay는 hero 전 구간에서 항상 켜진 상태여야 한다', () => {
    const startSnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0,
    });
    const spinSnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0.35,
    });
    const blackoutSnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0.54,
    });
    const closeupSnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0.72,
    });
    const webUiSnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0.92,
    });

    expect(startSnapshot.isMonitorOverlayVisible).toBe(true);
    expect(spinSnapshot.isMonitorOverlayVisible).toBe(true);
    expect(blackoutSnapshot.isMonitorOverlayVisible).toBe(true);
    expect(closeupSnapshot.isMonitorOverlayVisible).toBe(true);
    expect(webUiSnapshot.isMonitorOverlayVisible).toBe(true);
  });

  it('블랙아웃 IN 이후 클로즈업 구간에서는 blackout overlay가 걷히고 web UI가 등장해야 한다', () => {
    const blackoutSnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0.54,
    });
    const closeupSnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0.72,
    });
    const webUiSnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0.92,
    });

    expect(blackoutSnapshot.blackoutOpacity).toBeGreaterThan(0);
    expect(blackoutSnapshot.isCloseupCostumeHidden).toBe(false);
    expect(closeupSnapshot.blackoutOpacity).toBeLessThan(blackoutSnapshot.blackoutOpacity);
    expect(closeupSnapshot.isCloseupCostumeHidden).toBe(true);
    expect(webUiSnapshot.isCloseupCostumeHidden).toBe(true);
    expect(webUiSnapshot.webUiOpacity).toBeGreaterThan(0);
  });

  it('web UI 콘텐츠 높이가 커질수록 closeup 카메라는 더 앞으로 보정되어야 한다', () => {
    const compactUiSnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0.82,
      viewportHeight: 1000,
      webUiHeight: 360,
    });
    const tallUiSnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0.82,
      viewportHeight: 1000,
      webUiHeight: 760,
    });

    expect(tallUiSnapshot.cameraPosition[2]).toBeGreaterThan(compactUiSnapshot.cameraPosition[2]);
  });

  it('viewport와 web UI 높이 정보가 없으면 closeup 카메라 보정을 적용하지 않아야 한다', () => {
    const snapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0.82,
    });

    expect(snapshot.cameraPosition).toEqual([0, -0.3, -0.4]);
  });

  it('closeup 이전 구간에서는 web UI 높이 정보가 있어도 카메라 경로가 바뀌지 않아야 한다', () => {
    const baselineSnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0.35,
    });
    const compensatedSnapshot = getScrollTimelineSnapshot({
      initialPosition: DESKTOP_INITIAL_POSITION,
      progress: 0.35,
      viewportHeight: 1000,
      webUiHeight: 760,
    });

    expect(compensatedSnapshot.cameraPosition).toEqual(baselineSnapshot.cameraPosition);
  });
});
