import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { HomeHeroScene } from '@/widgets/home-hero-scene/ui/home-hero-scene';

import '@testing-library/jest-dom/vitest';

const HOME_HERO_PHOTO_ITEMS = [
  {
    alt: 'Hero photo 1',
    src: 'https://example.com/photo-1.jpg',
  },
  {
    alt: 'Hero photo 2',
    src: 'https://example.com/photo-2.jpg',
  },
  {
    alt: 'Hero photo 3',
    src: 'https://example.com/photo-3.jpg',
  },
];

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/widgets/home-hero-scene/ui/home-hero-stage', () => ({
  HomeHeroStage: ({
    onOpenImageViewer,
    selectedFrameImageSrc,
  }: {
    onOpenImageViewer?: () => void;
    selectedFrameImageSrc?: string | null;
  }) => (
    <button
      data-frame-screen-src={selectedFrameImageSrc ?? ''}
      data-testid="home-hero-stage"
      onClick={onOpenImageViewer}
      type="button"
    />
  ),
}));

vi.mock('@/widgets/home-hero-scene/ui/home-hero-web-ui', () => ({
  HomeHeroWebUi: () => <div data-testid="home-hero-web-ui" />,
}));

vi.mock('@/shared/ui/image-viewer/image-viewer-modal', () => ({
  ImageViewerModal: ({
    initialIndex,
    items,
    onSelectCurrentImage,
  }: {
    initialIndex: number | null;
    items: unknown[];
    onSelectCurrentImage?: (currentIndex: number) => void;
  }) => (
    <div data-testid="image-viewer-modal">
      <div
        data-count={items.length}
        data-index={initialIndex === null ? 'closed' : String(initialIndex)}
      />
      <button onClick={() => onSelectCurrentImage?.(1)} type="button">
        select-image
      </button>
    </div>
  ),
}));

describe('HomeHeroScene', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

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
        photoItems={HOME_HERO_PHOTO_ITEMS}
        title="Selected Projects"
      />,
    );

    expect(screen.getByTestId('home-hero-nav-lock-sentinel')).toBeTruthy();
    expect(screen.getByTestId('home-hero-stage')).toBeTruthy();
    expect(screen.getByTestId('home-hero-web-ui')).toBeTruthy();
  });

  it('camera click 시 ImageViewerModal은 storage photo 목록을 사용해야 한다', () => {
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
        photoItems={HOME_HERO_PHOTO_ITEMS}
        title="Selected Projects"
      />,
    );

    fireEvent.click(screen.getByTestId('home-hero-stage'));

    expect(screen.getByTestId('image-viewer-modal').firstElementChild).toHaveAttribute(
      'data-count',
      String(HOME_HERO_PHOTO_ITEMS.length),
    );
    expect(screen.getByTestId('image-viewer-modal').firstElementChild).toHaveAttribute(
      'data-index',
      '0',
    );
  });

  it('초기 렌더 시 첫 번째 임시 이미지가 액자에 기본 선택되어 있어야 한다', () => {
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
        photoItems={HOME_HERO_PHOTO_ITEMS}
        title="Selected Projects"
      />,
    );

    expect(screen.getByTestId('home-hero-stage')).toHaveAttribute(
      'data-frame-screen-src',
      HOME_HERO_PHOTO_ITEMS[0]?.src ?? '',
    );
  });

  it('image viewer에서 이미지를 선택하면 선택된 액자 이미지 src를 stage에 전달해야 한다', () => {
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
        photoItems={HOME_HERO_PHOTO_ITEMS}
        title="Selected Projects"
      />,
    );

    fireEvent.click(screen.getByTestId('home-hero-stage'));
    fireEvent.click(screen.getByRole('button', { name: 'select-image' }));

    expect(screen.getByTestId('home-hero-stage')).toHaveAttribute(
      'data-frame-screen-src',
      HOME_HERO_PHOTO_ITEMS[1]?.src ?? '',
    );
  });

  it('선택된 액자 이미지가 있으면 image viewer는 그 인덱스로 열려야 한다', () => {
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
        photoItems={HOME_HERO_PHOTO_ITEMS}
        title="Selected Projects"
      />,
    );

    fireEvent.click(screen.getByTestId('home-hero-stage'));
    fireEvent.click(screen.getByRole('button', { name: 'select-image' }));
    fireEvent.click(screen.getByTestId('home-hero-stage'));

    expect(screen.getByTestId('image-viewer-modal').firstElementChild).toHaveAttribute(
      'data-index',
      '1',
    );
  });

  it('저장된 액자 이미지가 있으면 다음 진입 시 localStorage 기준으로 복원해야 한다', () => {
    window.localStorage.setItem(
      'home-hero:selected-frame-image-src',
      HOME_HERO_PHOTO_ITEMS[2]?.src ?? '',
    );

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
        photoItems={HOME_HERO_PHOTO_ITEMS}
        title="Selected Projects"
      />,
    );

    expect(screen.getByTestId('home-hero-stage')).toHaveAttribute(
      'data-frame-screen-src',
      HOME_HERO_PHOTO_ITEMS[2]?.src ?? '',
    );
  });
});
