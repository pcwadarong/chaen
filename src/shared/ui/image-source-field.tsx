'use client';

import Image, { type StaticImageData } from 'next/image';
import React from 'react';
import { css, cx } from 'styled-system/css';

import { normalizeImageUrl } from '@/shared/lib/url/normalize-image-url';
import { Input } from '@/shared/ui/input/input';

type ImageSourceFieldProps = {
  className?: string;
  error?: string;
  fileInputAriaLabel: string;
  inputId: string;
  isUploading: boolean;
  label: string;
  onFileChange: React.ChangeEventHandler<HTMLInputElement>;
  onValueChange: (value: string) => void;
  previewAlt: string;
  previewUrl: StaticImageData | string;
  uploadButtonLabel?: string;
  value: string;
};

/**
 * 미리보기 이미지에 안전하게 전달할 수 있는 src만 추립니다.
 * 사용자 입력 문자열은 `https://` 절대 URL 또는 루트 상대 경로만 허용합니다.
 */
const resolvePreviewImageSrc = (previewUrl: ImageSourceFieldProps['previewUrl']) => {
  if (typeof previewUrl !== 'string') {
    return previewUrl;
  }

  const trimmedPreviewUrl = previewUrl.trim();

  if (!trimmedPreviewUrl) return null;
  if (trimmedPreviewUrl.startsWith('/')) return trimmedPreviewUrl;

  const normalizedPreviewUrl = normalizeImageUrl(trimmedPreviewUrl);

  if (!normalizedPreviewUrl?.startsWith('https://')) {
    return null;
  }

  return normalizedPreviewUrl;
};

/**
 * 이미지 URL 입력과 파일 업로드를 한 곳에서 제공하는 공용 필드입니다.
 */
export const ImageSourceField = ({
  className,
  error,
  fileInputAriaLabel,
  inputId,
  isUploading,
  label,
  onFileChange,
  onValueChange,
  previewAlt,
  previewUrl,
  uploadButtonLabel = '파일 업로드',
  value,
}: ImageSourceFieldProps) => {
  const normalizedPreviewUrl = resolvePreviewImageSrc(previewUrl);

  return (
    <section className={cx(rootClass, className)}>
      <label className={labelClass} htmlFor={inputId}>
        {label}
      </label>
      <div className={rowClass}>
        <Input
          className={inputClass}
          id={inputId}
          onChange={event => onValueChange(event.target.value)}
          placeholder="https://example.com/image.png"
          value={value}
        />
        <label className={uploadButtonWrapClass}>
          <span aria-live="polite" className={uploadButtonLabelClass} role="status">
            {isUploading ? '업로드 중...' : uploadButtonLabel}
          </span>
          <input
            accept="image/*"
            aria-label={fileInputAriaLabel}
            className={fileInputClass}
            disabled={isUploading}
            onChange={onFileChange}
            type="file"
          />
        </label>
      </div>
      {error ? (
        <p className={errorTextClass} role="alert">
          {error}
        </p>
      ) : null}
      {normalizedPreviewUrl ? (
        <div className={previewFrameClass}>
          <Image
            alt={previewAlt}
            className={previewImageClass}
            fill
            sizes="(max-width: 480px) 100vw, 480px"
            src={normalizedPreviewUrl}
            unoptimized
          />
        </div>
      ) : null}
    </section>
  );
};

const rootClass = css({
  display: 'grid',
  gap: '3',
});

const labelClass = css({
  fontSize: 'sm',
  fontWeight: '[700]',
  color: 'text',
});

const rowClass = css({
  display: 'flex',
  alignItems: 'stretch',
  gap: '3',
  '@media (max-width: 480px)': {
    flexDirection: 'column',
  },
});

const inputClass = css({
  flex: '1',
});

const uploadButtonWrapClass = css({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '[fit-content]',
  minHeight: '[2.375rem]',
  px: '3',
  borderRadius: 'full',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  bg: 'surface',
  color: 'text',
  cursor: 'pointer',
  flex: 'none',
});

const uploadButtonLabelClass = css({
  fontSize: 'sm',
  fontWeight: '[600]',
});

const fileInputClass = css({
  position: 'absolute',
  inset: '0',
  opacity: '0',
  cursor: 'pointer',
});

const errorTextClass = css({
  fontSize: 'xs',
  color: 'error',
});

const previewFrameClass = css({
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 'xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  bg: {
    base: 'gray.50',
    _dark: 'gray.900',
  },
  minHeight: '[12rem]',
});

const previewImageClass = css({
  display: 'block',
  width: 'full',
  height: '[12rem]',
  objectFit: 'cover',
});
