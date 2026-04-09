/* @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest';

import { initializeHomeHeroStageCanvas } from '@/widgets/home-hero-scene/model/home-hero-stage-canvas-adapter';

describe('initializeHomeHeroStageCanvas', () => {
  it('홈 히어로 stage settings로 초기화되면, canvas DOM과 clearColor는 홈 히어로 stage 규칙에 맞게 설정되어야 한다', () => {
    const canvasElement = document.createElement('canvas');
    const setClearColor = vi.fn();

    initializeHomeHeroStageCanvas({
      canvasElement,
      setClearColor,
    });

    expect(canvasElement.id).toBe('three-canvas');
    expect(canvasElement.style.touchAction).toBe('none');
    expect(setClearColor).toHaveBeenCalledWith(0x000000, 0);
  });
});
