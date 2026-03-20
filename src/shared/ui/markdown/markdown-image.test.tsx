import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { MarkdownImage } from '@/shared/ui/markdown/markdown-image';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) =>
    (
      ({
        closeAriaLabel: '이미지 뷰어 닫기',
        imageViewerAriaLabel: '이미지 뷰어',
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
  }: {
    initialIndex: number | null;
    items: Array<{ alt: string; src: string }>;
    labels: { imageViewerAriaLabel?: string };
  }) =>
    initialIndex !== null ? (
      <div
        aria-label={labels.imageViewerAriaLabel}
        data-alt={items[0]?.alt}
        data-src={items[0]?.src}
        data-testid="image-viewer-modal"
        role="dialog"
      />
    ) : null,
}));

describe('MarkdownImage', () => {
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

  it('Enter 키로도 이미지 뷰어를 연다', () => {
    render(<MarkdownImage alt="키보드 이미지" src="https://example.com/keyboard.png" />);

    fireEvent.keyDown(screen.getByRole('button', { name: '키보드 이미지 · 이미지 크게 보기' }), {
      key: 'Enter',
    });

    expect(screen.getByRole('dialog', { name: '이미지 뷰어' })).toBeTruthy();
  });
});
