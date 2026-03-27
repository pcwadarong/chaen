// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { getHomeHeroViewportMetrics } from '@/widgets/home-hero-scene/model/home-hero-viewport-metrics';

describe('getHomeHeroViewportMetrics', () => {
  it('viewport와 nav 높이가 주어지면 hero 가용 높이와 스크롤 섹션 높이를 계산해야 한다', () => {
    expect(
      getHomeHeroViewportMetrics({
        navHeight: 72,
        viewportHeight: 720,
      }),
    ).toEqual({
      availableHeight: 648,
      scrollSectionHeight: 2664,
      viewportHeight: 720,
    });
  });

  it('nav가 viewport보다 커도 음수 높이를 반환하면 안 된다', () => {
    expect(
      getHomeHeroViewportMetrics({
        navHeight: 120,
        viewportHeight: 80,
      }),
    ).toEqual({
      availableHeight: 0,
      scrollSectionHeight: 120,
      viewportHeight: 80,
    });
  });
});
