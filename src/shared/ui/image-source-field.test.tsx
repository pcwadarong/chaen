import { render, screen } from '@testing-library/react';
import type { StaticImageData } from 'next/image';
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
    src?: StaticImageData | string;
    unoptimized?: boolean;
  }) => {
    const normalizedSrc = typeof src === 'string' ? src : (src?.src ?? '');

    if (normalizedSrc && !normalizedSrc.startsWith('/')) {
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
    const { rerender } = render(<ImageSourceField {...baseProps} previewUrl="example.com" />);

    expect(screen.queryByAltText('이미지 미리보기')).toBeNull();

    rerender(<ImageSourceField {...baseProps} previewUrl="http://example.com/image.png" />);

    expect(screen.queryByAltText('이미지 미리보기')).toBeNull();
  });

  it('https 절대 URL, 루트 상대 경로, 정적 이미지만 미리보기를 렌더링한다', () => {
    const { rerender } = render(
      <ImageSourceField {...baseProps} previewUrl="https://example.com/image.png" />,
    );

    expect(screen.getByAltText('이미지 미리보기')).toHaveAttribute(
      'src',
      'https://example.com/image.png',
    );

    rerender(<ImageSourceField {...baseProps} previewUrl="/uploads/image.png" />);

    expect(screen.getByAltText('이미지 미리보기')).toHaveAttribute('src', '/uploads/image.png');

    rerender(
      <ImageSourceField
        {...baseProps}
        previewUrl={
          {
            height: 100,
            src: '/static/example.png',
            width: 100,
          } satisfies StaticImageData
        }
      />,
    );

    expect(screen.getByAltText('이미지 미리보기')).toHaveAttribute('src', '/static/example.png');
  });
});
