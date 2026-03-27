import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { HOME_HERO_TEMP_IMAGE_VIEWER_ITEMS } from '@/widgets/home-hero-scene/model/home-hero-temp-image-viewer-items';
import { HomeHeroScene } from '@/widgets/home-hero-scene/ui/home-hero-scene';

import '@testing-library/jest-dom/vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/widgets/home-hero-scene/ui/home-hero-stage', () => ({
  HomeHeroStage: ({ onOpenImageViewer }: { onOpenImageViewer?: () => void }) => (
    <button data-testid="home-hero-stage" onClick={onOpenImageViewer} type="button" />
  ),
}));

vi.mock('@/widgets/home-hero-scene/ui/home-hero-web-ui', () => ({
  HomeHeroWebUi: () => <div data-testid="home-hero-web-ui" />,
}));

vi.mock('@/shared/ui/image-viewer/image-viewer-modal', () => ({
  ImageViewerModal: ({
    initialIndex,
    items,
  }: {
    initialIndex: number | null;
    items: unknown[];
  }) => (
    <div
      data-count={items.length}
      data-index={initialIndex === null ? 'closed' : String(initialIndex)}
      data-testid="image-viewer-modal"
    />
  ),
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

  it('camera click 임시 연결을 위해 ImageViewerModal은 placeholder 이미지 목록을 사용해야 한다', () => {
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

    fireEvent.click(screen.getByTestId('home-hero-stage'));

    expect(screen.getByTestId('image-viewer-modal')).toHaveAttribute(
      'data-count',
      String(HOME_HERO_TEMP_IMAGE_VIEWER_ITEMS.length),
    );
    expect(screen.getByTestId('image-viewer-modal')).toHaveAttribute('data-index', '0');
  });
});
