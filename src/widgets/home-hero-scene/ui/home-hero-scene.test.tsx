import { render, screen } from '@testing-library/react';
import React from 'react';

import { HomeHeroScene } from '@/widgets/home-hero-scene/ui/home-hero-scene';

vi.mock('@/widgets/home-hero-scene/ui/home-hero-stage', () => ({
  HomeHeroStage: () => <div data-testid="home-hero-stage" />,
}));

vi.mock('@/widgets/home-hero-scene/ui/home-hero-web-ui', () => ({
  HomeHeroWebUi: () => <div data-testid="home-hero-web-ui" />,
}));

describe('HomeHeroScene', () => {
  it('캔버스와 웹 UI 레이어를 함께 렌더링한다', () => {
    render(
      <HomeHeroScene
        description="desc"
        items={[
          {
            deliverableKeys: ['motionTokens'],
            id: 'motion-library',
            year: '2026',
          },
        ]}
        title="Selected Projects"
      />,
    );

    expect(screen.getByTestId('home-hero-stage')).toBeTruthy();
    expect(screen.getByTestId('home-hero-web-ui')).toBeTruthy();
  });
});
