/* @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest';

import { initializeHomeHeroStageCanvas } from '@/widgets/home-hero-scene/model/home-hero-stage-canvas-adapter';

describe('initializeHomeHeroStageCanvas', () => {
  it('canvas DOM 속성과 clearColor를 홈 히어로 stage 규칙에 맞게 초기화해야 한다', () => {
    const canvasElement = document.createElement('canvas');
    const setClearColor = vi.fn();

    initializeHomeHeroStageCanvas({
      canvasElement,
      setClearColor,
    });

    expect(canvasElement.id).toBe('three-canvas');
    expect(canvasElement.getAttribute('aria-hidden')).toBe('true');
    expect(canvasElement.getAttribute('role')).toBe('presentation');
    expect(canvasElement.style.touchAction).toBe('none');
    expect(setClearColor).toHaveBeenCalledWith(0x000000, 0);
  });
});
