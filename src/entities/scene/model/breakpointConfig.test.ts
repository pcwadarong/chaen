import { describe, expect, it } from 'vitest';

import {
  BREAKPOINTS,
  getSceneBreakpoint,
  getSceneMode,
} from '@/entities/scene/model/breakpointConfig';

describe('breakpointConfig', () => {
  it('홈 씬이 mobile S, mobile L, tablet, desktop 최대 너비를 순서대로 노출한다', () => {
    expect(BREAKPOINTS).toEqual({
      BP1: 480,
      BP2: 640,
      BP3: 960,
      BP4: 1200,
    });
  });

  it('viewport 너비를 canonical 5단계 breakpoint 번호로 변환한다', () => {
    expect(getSceneBreakpoint(320)).toBe(1);
    expect(getSceneBreakpoint(480)).toBe(1);
    expect(getSceneBreakpoint(481)).toBe(2);
    expect(getSceneBreakpoint(640)).toBe(2);
    expect(getSceneBreakpoint(641)).toBe(3);
    expect(getSceneBreakpoint(960)).toBe(3);
    expect(getSceneBreakpoint(961)).toBe(4);
    expect(getSceneBreakpoint(1200)).toBe(4);
    expect(getSceneBreakpoint(1201)).toBe(5);
  });

  it('tablet 이하를 모바일 모드로, desktop부터 데스크탑 모드로 판별한다', () => {
    expect(getSceneMode(375)).toBe('mobile');
    expect(getSceneMode(960)).toBe('mobile');
    expect(getSceneMode(961)).toBe('desktop');
    expect(getSceneMode(1440)).toBe('desktop');
  });
});
