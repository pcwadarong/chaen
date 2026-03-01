import { render, screen } from '@testing-library/react';
import React from 'react';

import { HomeHeroWebUi } from '@/widgets/home-hero-scene/ui/home-hero-web-ui';

vi.mock('@/widgets/project-showcase/ui/project-showcase', () => ({
  ProjectShowcase: () => <div>Mock Project Showcase</div>,
}));

describe('HomeHeroWebUi', () => {
  it('실제 HTML UI 레이어를 렌더링한다', () => {
    render(
      <HomeHeroWebUi
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

    expect(screen.getByText('Mock Project Showcase')).toBeTruthy();
  });
});
