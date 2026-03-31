/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { MarkdownGallery } from '@/shared/ui/markdown/markdown-gallery';

vi.mock('@/shared/ui/markdown/markdown-image', () => ({
  MarkdownImage: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

describe('MarkdownGallery', () => {
  it('다음 버튼을 누르면 다음 슬라이드 위치로 스크롤을 요청해야 한다', () => {
    render(
      <MarkdownGallery
        galleryId="gallery-test"
        items={[
          { alt: '첫 번째', src: 'https://example.com/one.png', viewerId: 'image-0' },
          { alt: '두 번째', src: 'https://example.com/two.png', viewerId: 'image-1' },
        ]}
      />,
    );

    const gallery = document.querySelector('[data-markdown-gallery="true"]');
    const scrollContainer = gallery?.querySelector(
      '[data-markdown-gallery-track="true"]',
    ) as HTMLDivElement | null;

    expect(scrollContainer).toBeTruthy();
    if (!scrollContainer) throw new Error('scroll container is required');

    Object.defineProperty(scrollContainer, 'clientWidth', {
      configurable: true,
      value: 360,
    });
    const slides = Array.from(
      scrollContainer.querySelectorAll<HTMLElement>('[data-markdown-gallery-slide="true"]'),
    );
    Object.defineProperty(slides[0], 'offsetLeft', {
      configurable: true,
      value: 0,
    });
    Object.defineProperty(slides[1], 'offsetLeft', {
      configurable: true,
      value: 302,
    });
    scrollContainer.scrollTo = vi.fn();

    fireEvent.click(screen.getByRole('button', { name: '다음 이미지' }));

    expect(scrollContainer.scrollTo).toHaveBeenCalledWith({
      behavior: 'smooth',
      left: 302,
    });
  });
});
