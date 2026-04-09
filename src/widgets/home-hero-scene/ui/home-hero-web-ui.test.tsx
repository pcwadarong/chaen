import { render, screen } from '@testing-library/react';
import React from 'react';

import { HomeHeroWebUi } from '@/widgets/home-hero-scene/ui/home-hero-web-ui';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/widgets/project-showcase/ui/project-showcase', () => ({
  ProjectShowcase: () => <div>Mock Project Showcase</div>,
}));

describe('HomeHeroWebUi', () => {
  it('홈 히어로 web layer가 마운트되면, ProjectShowcase를 HTML UI 레이어 안에 포함해야 한다', () => {
    render(
      <HomeHeroWebUi
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

    expect(screen.getByText('Mock Project Showcase')).toBeTruthy();
  });
});
