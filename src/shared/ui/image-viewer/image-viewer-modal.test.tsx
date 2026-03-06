import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { ImageViewerModal } from '@/shared/ui/image-viewer/image-viewer-modal';

/* eslint-disable @next/next/no-img-element */
vi.mock('next/image', () => ({
  default: ({ alt, ...props }: { alt: string }) => <img alt={alt} {...props} />,
}));

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
});
