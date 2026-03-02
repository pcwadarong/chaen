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
  it('실제 HTML UI 레이어를 렌더링한다', () => {
    render(
      <HomeHeroWebUi
        items={[
          {
            id: 'motion-library',
            title: 'Motion Library',
            description: 'description',
            content: 'content',
            thumbnail_url: null,
            gallery_urls: null,
            tags: ['react'],
            created_at: '2026-01-01T00:00:00.000Z',
          },
        ]}
        title="Selected Projects"
      />,
    );

    expect(screen.getByText('Mock Project Showcase')).toBeTruthy();
  });
});
