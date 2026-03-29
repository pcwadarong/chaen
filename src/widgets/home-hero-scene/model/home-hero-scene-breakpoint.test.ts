// @vitest-environment node

import { describe, expect, it } from 'vitest';

import {
  getHomeHeroBreakpointState,
  getHomeHeroSceneMode,
} from '@/widgets/home-hero-scene/model/home-hero-scene-breakpoint';

describe('getHomeHeroSceneMode', () => {
  it('세로 비율이 큰 큰 화면에서는 홈 히어로 씬을 mobile로 유지해야 한다', () => {
    expect(
      getHomeHeroSceneMode({
        height: 1600,
        width: 1400,
      }),
    ).toBe('mobile');
  });

  it('가로 비율이 충분한 작은 화면에서는 홈 히어로 씬을 desktop으로 전환해야 한다', () => {
    expect(
      getHomeHeroSceneMode({
        height: 375,
        width: 812,
      }),
    ).toBe('desktop');
  });
});

describe('getHomeHeroBreakpointState', () => {
  it('mobile scene에서는 width 기준으로 mobile breakpoint를 선택해야 한다', () => {
    expect(
      getHomeHeroBreakpointState({
        height: 1200,
        width: 430,
      }),
    ).toEqual({
      currentBP: 1,
      sceneMode: 'mobile',
    });
  });

  it('desktop scene에서는 width 기준으로 desktop breakpoint를 선택해야 한다', () => {
    expect(
      getHomeHeroBreakpointState({
        height: 768,
        width: 1024,
      }),
    ).toEqual({
      currentBP: 3,
      sceneMode: 'desktop',
    });
  });
});
