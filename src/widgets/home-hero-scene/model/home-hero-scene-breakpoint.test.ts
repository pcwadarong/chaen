// @vitest-environment node

import { describe, expect, it } from 'vitest';

import {
  getHomeHeroBreakpointState,
  getHomeHeroSceneViewportMode,
} from '@/widgets/home-hero-scene/model/home-hero-scene-breakpoint';

describe('getHomeHeroSceneViewportMode', () => {
  it('세로 비율이 큰 화면에서는 홈 히어로 씬을 stacked로 유지해야 한다', () => {
    expect(
      getHomeHeroSceneViewportMode({
        height: 1600,
        width: 1400,
      }),
    ).toBe('stacked');
  });

  it('가로 비율이 충분한 작은 화면에서는 홈 히어로 씬을 wide로 전환해야 한다', () => {
    expect(
      getHomeHeroSceneViewportMode({
        height: 375,
        width: 812,
      }),
    ).toBe('wide');
  });
});

describe('getHomeHeroBreakpointState', () => {
  it('stacked scene에서는 width 기준으로 stacked breakpoint를 선택해야 한다', () => {
    expect(
      getHomeHeroBreakpointState({
        height: 1200,
        width: 430,
      }),
    ).toEqual({
      currentBP: 1,
      sceneViewportMode: 'stacked',
    });
  });

  it('wide scene에서는 width 기준으로 wide breakpoint를 선택해야 한다', () => {
    expect(
      getHomeHeroBreakpointState({
        height: 768,
        width: 1024,
      }),
    ).toEqual({
      currentBP: 3,
      sceneViewportMode: 'wide',
    });
  });
});
