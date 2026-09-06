/* @vitest-environment jsdom */

import { act, renderHook } from '@testing-library/react';

import type { HomeHeroImageViewerItem } from '@/widgets/home-hero-scene/model/home-hero-image-viewer-item';
import { useHomeHeroFrameSelection } from '@/widgets/home-hero-scene/model/use-home-hero-frame-selection';

const PHOTO_ITEMS = [
  { alt: 'photo 1', src: 'https://example.com/photo-1.jpg' },
  { alt: 'photo 2', src: 'https://example.com/photo-2.jpg' },
  { alt: 'photo 3', src: 'https://example.com/photo-3.jpg' },
];

describe('useHomeHeroFrameSelection', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('storage photo 목록이 주어지면, useHomeHeroFrameSelection은 첫 번째 이미지를 기본 액자 이미지로 선택해야 한다', () => {
    const { result } = renderHook(() =>
      useHomeHeroFrameSelection({
        photoItems: PHOTO_ITEMS,
      }),
    );

    expect(result.current.selectedFrameImageSrc).toBe(PHOTO_ITEMS[0]?.src ?? null);
  });

  it('저장된 액자 이미지가 있으면, useHomeHeroFrameSelection은 localStorage 값을 복원해야 한다', () => {
    window.localStorage.setItem('home-hero:selected-frame-image-src', PHOTO_ITEMS[2]?.src ?? '');

    const { result } = renderHook(() =>
      useHomeHeroFrameSelection({
        photoItems: PHOTO_ITEMS,
      }),
    );

    expect(result.current.selectedFrameImageSrc).toBe(PHOTO_ITEMS[2]?.src ?? null);
  });

  it('현재 액자 이미지가 두 번째일 때, useHomeHeroFrameSelection은 이미지 뷰어를 같은 인덱스로 열어야 한다', () => {
    const { result } = renderHook(() =>
      useHomeHeroFrameSelection({
        photoItems: PHOTO_ITEMS,
      }),
    );

    act(() => {
      result.current.selectFrameImageByIndex(1);
      result.current.openImageViewer();
    });

    expect(result.current.imageViewerOpenIndex).toBe(1);
  });

  it('사진 목록이 아직 도착하지 않았을 때 뷰어를 열면, 목록이 뒤늦게 도착해도 뷰어가 저절로 열리지 않아야 한다', () => {
    const { rerender, result } = renderHook(
      ({ photoItems }) => useHomeHeroFrameSelection({ photoItems }),
      { initialProps: { photoItems: [] as HomeHeroImageViewerItem[] } },
    );

    act(() => {
      result.current.openImageViewer();
    });

    expect(result.current.imageViewerOpenIndex).toBeNull();

    rerender({ photoItems: PHOTO_ITEMS });

    expect(result.current.imageViewerOpenIndex).toBeNull();
  });
});
