import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import type { MarkdownImageViewerItem } from '@/shared/lib/markdown/collect-markdown-images';
import { MarkdownImage } from '@/shared/ui/markdown/markdown-image';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) =>
    (
      ({
        actionBarAriaLabel: '이미지 액션 바',
        closeAriaLabel: '이미지 뷰어 닫기',
        fitToScreenAriaLabel: '화면에 맞추기',
        imageViewerAriaLabel: '이미지 뷰어',
        locateSourceAriaLabel: '이미지 위치로 글 이동',
        nextAriaLabel: '다음 이미지 보기',
        openAriaLabel: '이미지 크게 보기',
        previousAriaLabel: '이전 이미지 보기',
        thumbnailListAriaLabel: '이미지 썸네일 목록',
        zoomInAriaLabel: '이미지 확대',
        zoomOutAriaLabel: '이미지 축소',
      }) as const
    )[key] ?? key,
}));

vi.mock('@/shared/ui/image-viewer/image-viewer-modal', () => ({
  ImageViewerModal: ({
    initialIndex,
    items,
    labels,
    onClose,
    onLocateSource,
  }: {
    initialIndex: number | null;
    items: MarkdownImageViewerItem[];
    labels: { imageViewerAriaLabel?: string };
    onClose: () => void;
    onLocateSource?: (currentIndex: number) => void;
  }) =>
    initialIndex !== null ? (
      <div
        aria-label={labels.imageViewerAriaLabel}
        data-alt={items[0]?.alt}
        data-count={String(items.length)}
        data-initial-index={String(initialIndex)}
        data-src={items[0]?.src}
        data-testid="image-viewer-modal"
        role="dialog"
      >
        <button onClick={() => onClose()} type="button">
          close-with-second-image
        </button>
        <button onClick={() => onLocateSource?.(1)} type="button">
          locate-second-image
        </button>
      </div>
    ) : null,
}));

describe('MarkdownImage', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('이미지 자체를 뷰어 트리거로 렌더링한다', () => {
    render(<MarkdownImage alt="설명" src="https://example.com/image.png" />);

    const trigger = screen.getByRole('button', { name: '설명 · 이미지 크게 보기' });

    expect(trigger.tagName).toBe('IMG');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('클릭하면 이미지 뷰어를 연다', () => {
    render(<MarkdownImage alt="설명" src="https://example.com/image.png" />);

    fireEvent.click(screen.getByRole('button', { name: '설명 · 이미지 크게 보기' }));

    const modal = screen.getByTestId('image-viewer-modal');
    expect(modal.getAttribute('data-src')).toBe('https://example.com/image.png');
    expect(modal.getAttribute('data-alt')).toBe('설명');
  });

  it('viewerItems가 있으면 본문 전체 이미지 목록과 현재 인덱스를 함께 전달한다', () => {
    render(
      <MarkdownImage
        alt="두 번째 이미지"
        imageIndex={1}
        src="https://example.com/two.png"
        viewerItems={[
          {
            alt: '첫 번째 이미지',
            src: 'https://example.com/one.png',
            viewerId: 'markdown-image-0',
          },
          {
            alt: '두 번째 이미지',
            src: 'https://example.com/two.png',
            viewerId: 'markdown-image-1',
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '두 번째 이미지 · 이미지 크게 보기' }));

    const modal = screen.getByTestId('image-viewer-modal');
    expect(modal.getAttribute('data-count')).toBe('2');
    expect(modal.getAttribute('data-initial-index')).toBe('1');
  });

  it('Enter와 Space 키로도 이미지 뷰어를 연다', () => {
    render(<MarkdownImage alt="키보드 이미지" src="https://example.com/keyboard.png" />);

    const trigger = screen.getByRole('button', { name: '키보드 이미지 · 이미지 크게 보기' });

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.getByRole('dialog', { name: '이미지 뷰어' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'close-with-second-image' }));
    fireEvent.keyDown(trigger, { key: ' ' });
    expect(screen.getByRole('dialog', { name: '이미지 뷰어' })).toBeTruthy();
  });

  it('이미지 위치 액션으로 현재 보고 있는 이미지 위치로 스크롤을 복귀한다', () => {
    const scrollToMock = vi.fn();
    const viewerItems = [
      {
        alt: '첫 번째 이미지',
        src: 'https://example.com/one.png',
        viewerId: 'markdown-image-0',
      },
      {
        alt: '두 번째 이미지',
        src: 'https://example.com/two.png',
        viewerId: 'markdown-image-1',
      },
    ] satisfies MarkdownImageViewerItem[];
    const { container } = render(
      <div data-primary-scroll-region="true">
        <MarkdownImage
          alt="첫 번째 이미지"
          imageIndex={0}
          src="https://example.com/one.png"
          viewerItems={viewerItems}
        />
        <MarkdownImage
          alt="두 번째 이미지"
          imageIndex={1}
          src="https://example.com/two.png"
          viewerItems={viewerItems}
        />
      </div>,
    );
    const scrollRegion = container.querySelector(
      '[data-primary-scroll-region="true"]',
    ) as HTMLElement;
    const secondImage = screen.getByRole('button', { name: '두 번째 이미지 · 이미지 크게 보기' });

    Object.defineProperty(scrollRegion, 'scrollTop', {
      configurable: true,
      value: 120,
      writable: true,
    });
    Object.defineProperty(scrollRegion, 'scrollTo', {
      configurable: true,
      value: scrollToMock,
      writable: true,
    });
    Object.defineProperty(scrollRegion, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ height: 600, left: 0, top: 80, width: 800 }),
    });
    Object.defineProperty(secondImage, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ height: 240, left: 0, top: 420, width: 320 }),
    });

    fireEvent.click(screen.getByRole('button', { name: '첫 번째 이미지 · 이미지 크게 보기' }));
    fireEvent.click(screen.getByRole('button', { name: 'locate-second-image' }));

    expect(scrollToMock).toHaveBeenCalledWith({
      behavior: 'auto',
      top: 280,
    });
  });

  it('닫기만 할 때는 원문 이미지 위치로 스크롤을 이동하지 않는다', () => {
    const scrollToMock = vi.fn();
    const viewerItems = [
      {
        alt: '첫 번째 이미지',
        src: 'https://example.com/one.png',
        viewerId: 'markdown-image-0',
      },
      {
        alt: '두 번째 이미지',
        src: 'https://example.com/two.png',
        viewerId: 'markdown-image-1',
      },
    ] satisfies MarkdownImageViewerItem[];
    const { container } = render(
      <div data-primary-scroll-region="true">
        <MarkdownImage
          alt="첫 번째 이미지"
          imageIndex={0}
          src="https://example.com/one.png"
          viewerItems={viewerItems}
        />
      </div>,
    );
    const scrollRegion = container.querySelector(
      '[data-primary-scroll-region="true"]',
    ) as HTMLElement;

    Object.defineProperty(scrollRegion, 'scrollTo', {
      configurable: true,
      value: scrollToMock,
      writable: true,
    });

    fireEvent.click(screen.getByRole('button', { name: '첫 번째 이미지 · 이미지 크게 보기' }));
    fireEvent.click(screen.getByRole('button', { name: 'close-with-second-image' }));

    expect(scrollToMock).not.toHaveBeenCalled();
  });
});
