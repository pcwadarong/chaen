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
  it('첫 화면 안전 구간 sentinel과 함께 캔버스 및 웹 UI 레이어를 렌더링한다', () => {
    render(
      <HomeHeroScene
        items={[
          {
            id: 'motion-library',
            title: 'Motion Library',
            description: 'description',
            thumbnail_url: null,
            publish_at: '2026-01-01T00:00:00.000Z',
            slug: 'motion-library',
          },
        ]}
        title="Selected Projects"
      />,
    );

    expect(screen.getByTestId('home-hero-nav-lock-sentinel')).toBeTruthy();
    expect(screen.getByTestId('home-hero-stage')).toBeTruthy();
    expect(screen.getByTestId('home-hero-web-ui')).toBeTruthy();
  });
});
