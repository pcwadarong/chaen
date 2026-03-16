import { render, screen } from '@testing-library/react';
import React from 'react';

import { ImageSourceField } from '@/shared/ui/image-source-field';

import '@testing-library/jest-dom/vitest';

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({
    alt,
    fill: _fill,
    src,
    unoptimized: _unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    unoptimized?: boolean;
  }) => {
    const normalizedSrc = typeof src === 'string' ? src : '';

    if (!normalizedSrc.startsWith('/')) {
      new URL(normalizedSrc);
    }

    return React.createElement('img', { alt, src: normalizedSrc, ...props });
  },
}));

describe('ImageSourceField', () => {
  const baseProps = {
    fileInputAriaLabel: '이미지 파일 업로드',
    inputId: 'image-source-field',
    isUploading: false,
    label: '이미지',
    onFileChange: vi.fn(),
    onValueChange: vi.fn(),
    previewAlt: '이미지 미리보기',
    value: '',
  } satisfies Omit<React.ComponentProps<typeof ImageSourceField>, 'previewUrl'>;

  it('유효하지 않은 previewUrl은 미리보기를 렌더링하지 않는다', () => {
    render(<ImageSourceField {...baseProps} previewUrl="example.com" />);

    expect(screen.queryByAltText('이미지 미리보기')).toBeNull();
  });

  it('절대 URL 또는 루트 상대 경로만 미리보기를 렌더링한다', () => {
    const { rerender } = render(
      <ImageSourceField {...baseProps} previewUrl="https://example.com/image.png" />,
    );

    expect(screen.getByAltText('이미지 미리보기')).toHaveAttribute(
      'src',
      'https://example.com/image.png',
    );

    rerender(<ImageSourceField {...baseProps} previewUrl="/uploads/image.png" />);

    expect(screen.getByAltText('이미지 미리보기')).toHaveAttribute('src', '/uploads/image.png');
  });
});
