// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { getDisabledScrollTimelineSnapshot } from '@/features/scroll-timeline/model/disabled-scroll-timeline-snapshot';

describe('getDisabledScrollTimelineSnapshot', () => {
  it('스크롤 타임라인이 비활성화된 환경일 때 hero web UI는 즉시 보이고 상호작용 가능 상태여야 한다', () => {
    const snapshot = getDisabledScrollTimelineSnapshot({
      initialPosition: [0, 1, 9],
    });

    expect(snapshot.blackoutOpacity).toBe(0);
    expect(snapshot.isMonitorOverlayVisible).toBe(true);
    expect(snapshot.isScrollDriven).toBe(false);
    expect(snapshot.isSequenceActive).toBe(false);
    expect(snapshot.webUiOpacity).toBe(1);
  });
});
