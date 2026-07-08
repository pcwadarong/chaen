/* @vitest-environment node */

import { describe, expect, it } from 'vitest';

import {
  resolveMonitorFontFamily,
  resolveMonitorRenderScale,
} from '@/features/monitor-overlay/model/use-monitor-overlay-texture';

describe('resolveMonitorRenderScale', () => {
  it('devicePixelRatio가 2를 넘으면 슈퍼샘플링 배율을 2로 제한해야 한다', () => {
    expect(resolveMonitorRenderScale(3)).toBe(2);
  });

  it('devicePixelRatio가 2 이하이면 그대로 슈퍼샘플링 배율로 사용해야 한다', () => {
    expect(resolveMonitorRenderScale(1)).toBe(1);
    expect(resolveMonitorRenderScale(1.5)).toBe(1.5);
    expect(resolveMonitorRenderScale(2)).toBe(2);
  });
});

describe('resolveMonitorFontFamily', () => {
  it('document가 없는 SSR 환경에서는 generic sans-serif 폴백을 반환해야 한다', () => {
    expect(resolveMonitorFontFamily()).toBe('sans-serif');
  });
});
