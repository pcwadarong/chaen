import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { ImageViewerModal } from '@/shared/ui/image-viewer/image-viewer-modal';

vi.mock('@/shared/ui/modal/modal', () => ({
  Modal: ({
    ariaLabel,
    children,
    isOpen,
  }: {
    ariaLabel?: string;
    children: React.ReactNode;
    isOpen: boolean;
  }) =>
    isOpen ? (
      <div aria-label={ariaLabel} role="dialog">
        {children}
      </div>
    ) : null,
}));

describe('ImageViewerModal', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: vi.fn(),
      writable: true,
    });
  });

  const labels = {
    closeAriaLabel: '닫기',
    imageViewerAriaLabel: '이미지 뷰어',
    nextAriaLabel: '다음 이미지',
    previousAriaLabel: '이전 이미지',
    thumbnailListAriaLabel: '썸네일 목록',
    zoomInAriaLabel: '확대',
    zoomOutAriaLabel: '축소',
  };

  const items = [
    { alt: '첫 번째 이미지', src: '/one.jpg' },
    { alt: '두 번째 이미지', src: '/two.jpg' },
  ];

  it('썸네일 버튼에 설명적인 접근성 라벨과 현재 상태를 제공한다', () => {
    render(<ImageViewerModal initialIndex={0} items={items} labels={labels} onClose={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: '첫 번째 이미지 1' }).getAttribute('aria-current'),
    ).toBe('true');
    expect(
      screen.getByRole('button', { name: '두 번째 이미지 2' }).getAttribute('aria-current'),
    ).toBeNull();
  });

  it('ArrowRight와 ArrowLeft 키로 이미지를 전환한다', () => {
    render(<ImageViewerModal initialIndex={0} items={items} labels={labels} onClose={vi.fn()} />);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(
      screen.getByRole('button', { name: '두 번째 이미지 2' }).getAttribute('aria-current'),
    ).toBe('true');

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(
      screen.getByRole('button', { name: '첫 번째 이미지 1' }).getAttribute('aria-current'),
    ).toBe('true');
  });

  it('remotePatterns에 없는 외부 이미지 URL도 그대로 렌더링한다', () => {
    render(
      <ImageViewerModal
        initialIndex={0}
        items={[{ alt: '외부 이미지', src: 'https://github.com/user-attachments/assets/demo' }]}
        labels={labels}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen
        .getAllByAltText('외부 이미지')
        .every(
          node => node.getAttribute('src') === 'https://github.com/user-attachments/assets/demo',
        ),
    ).toBe(true);
  });

  it('확대된 상태에서는 포인터 드래그로 이미지를 이동한다', () => {
    const { container } = render(
      <ImageViewerModal initialIndex={0} items={items} labels={labels} onClose={vi.fn()} />,
    );
    const viewport = container.querySelector(
      '[data-image-viewer-viewport="true"]',
    ) as HTMLDivElement;
    const image = container.querySelector('[data-image-viewer-image="true"]') as HTMLImageElement;

    Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 300 });
    Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: 200 });
    Object.defineProperty(viewport, 'setPointerCapture', { configurable: true, value: vi.fn() });
    Object.defineProperty(viewport, 'hasPointerCapture', {
      configurable: true,
      value: vi.fn(() => true),
    });
    Object.defineProperty(viewport, 'releasePointerCapture', {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(image, 'clientWidth', { configurable: true, value: 200 });
    Object.defineProperty(image, 'clientHeight', { configurable: true, value: 100 });

    for (let step = 0; step < 4; step += 1) {
      fireEvent.click(screen.getByRole('button', { name: '확대' }));
    }

    fireEvent.pointerDown(viewport, { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(viewport, { clientX: 160, clientY: 120, pointerId: 1 });

    expect(image.getAttribute('style')).toContain('translate3d(50px, 0px, 0)');
    expect(image.getAttribute('style')).toContain('scale(2)');
  });
});
