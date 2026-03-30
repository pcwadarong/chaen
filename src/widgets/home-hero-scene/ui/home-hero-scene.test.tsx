/* @vitest-environment jsdom */

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
    content,
    interaction,
  }: {
    content?: {
      selectedFrameImageSrc?: string | null;
    };
    interaction?: {
      onBrowseProjects?: () => void;
      onOpenImageViewer?: () => void;
    };
  }) => (
    <div>
      <button
        data-frame-screen-src={content?.selectedFrameImageSrc ?? ''}
        data-testid="home-hero-stage"
        onClick={interaction?.onOpenImageViewer}
        type="button"
      />
      <button onClick={interaction?.onBrowseProjects} type="button">
        browse-projects
      </button>
    </div>
  ),
}));

vi.mock('@/widgets/home-hero-scene/ui/home-hero-web-ui', () => ({
  HomeHeroWebUi: () => <div data-testid="home-hero-web-ui" />,
}));

vi.mock('@/widgets/home-hero-scene/ui/home-hero-contact-buttons', () => ({
  HomeHeroContactButtons: () => <div data-testid="home-hero-contact-buttons" />,
}));

vi.mock('@/widgets/home-hero-scene/ui/home-hero-mobile-project-sheet', () => ({
  HomeHeroMobileProjectSheet: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div
        aria-label="mobileProjectPanelAriaLabel"
        data-testid="home-hero-mobile-project-sheet"
        role="dialog"
      >
        <button aria-label="mobileProjectPanelCloseLabel" onClick={onClose} type="button" />
      </div>
    ) : (
      <div data-testid="home-hero-mobile-project-sheet" />
    ),
}));

vi.mock('@/widgets/home-hero-scene/ui/home-hero-interaction-hint', () => ({
  HomeHeroInteractionHint: ({ hidden = false }: { hidden?: boolean }) => (
    <div data-hidden={String(hidden)} data-testid="home-hero-interaction-hint" />
  ),
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

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('localStorage getItem이 실패해도 기본 액자 이미지를 유지한 채 렌더링해야 한다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage denied');
    });

    expect(() =>
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
      ),
    ).not.toThrow();

    expect(screen.getByTestId('home-hero-stage')).toHaveAttribute(
      'data-frame-screen-src',
      HOME_HERO_PHOTO_ITEMS[0]?.src ?? '',
    );
  });

  it('localStorage setItem이 실패해도 선택한 액자 이미지는 화면 상태에 반영해야 한다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage denied');
    });

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

  it('browse action이 들어오면 모바일 프로젝트 패널을 열어야 한다', () => {
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

    fireEvent.click(screen.getByRole('button', { name: 'browse-projects' }));

    expect(screen.getByRole('dialog', { name: 'mobileProjectPanelAriaLabel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'mobileProjectPanelCloseLabel' })).toBeTruthy();
  });
});
