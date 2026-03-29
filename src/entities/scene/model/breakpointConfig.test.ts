// @vitest-environment node

import { describe, expect, it } from 'vitest';

import {
  BREAKPOINTS,
  getSceneBreakpoint,
  getSceneViewportMode,
  SCENE_VIEWPORT_MODE,
} from '@/entities/scene/model/breakpointConfig';

describe('breakpointConfig', () => {
  it('홈 씬이 stacked S, stacked L, wide S 최대 너비를 순서대로 노출한다', () => {
    expect(BREAKPOINTS).toEqual({
      BP1: 480,
      BP2: 960,
      BP3: 1119,
    });
  });

  it('viewport 너비를 홈 씬용 4단계 breakpoint 번호로 변환한다', () => {
    expect(getSceneBreakpoint(320)).toBe(1);
    expect(getSceneBreakpoint(480)).toBe(1);
    expect(getSceneBreakpoint(481)).toBe(2);
    expect(getSceneBreakpoint(960)).toBe(2);
    expect(getSceneBreakpoint(961)).toBe(3);
    expect(getSceneBreakpoint(1119)).toBe(3);
    expect(getSceneBreakpoint(1120)).toBe(4);
    expect(getSceneBreakpoint(1440)).toBe(4);
  });

  it('네비 모바일 메뉴가 보이는 tablet 구간까지는 stacked 모드로 판별한다', () => {
    expect(getSceneViewportMode(375)).toBe(SCENE_VIEWPORT_MODE.stacked);
    expect(getSceneViewportMode(768)).toBe(SCENE_VIEWPORT_MODE.stacked);
    expect(getSceneViewportMode(960)).toBe(SCENE_VIEWPORT_MODE.stacked);
    expect(getSceneViewportMode(961)).toBe(SCENE_VIEWPORT_MODE.wide);
    expect(getSceneViewportMode(1440)).toBe(SCENE_VIEWPORT_MODE.wide);
  });
});
