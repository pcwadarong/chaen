'use client';

import Image from 'next/image';
import React from 'react';
import { css, cx } from 'styled-system/css';

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
  previewUrl: string;
  uploadButtonLabel?: string;
  value: string;
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
}: ImageSourceFieldProps) => (
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
        <span className={uploadButtonLabelClass}>
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
    {previewUrl ? (
      <div className={previewFrameClass}>
        <Image
          alt={previewAlt}
          className={previewImageClass}
          fill
          sizes="(max-width: 480px) 100vw, 480px"
          src={previewUrl}
          unoptimized
        />
      </div>
    ) : null}
  </section>
);

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
