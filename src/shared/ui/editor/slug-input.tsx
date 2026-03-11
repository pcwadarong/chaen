'use client';

import React from 'react';
import { css, cx } from 'styled-system/css';

import { normalizeSlugInput } from '@/shared/lib/editor/slug';
import { LockIcon } from '@/shared/ui/icons/app-icons';
import { Input } from '@/shared/ui/input/input';

type SlugInputProps = {
  className?: string;
  isPublished?: boolean;
  onChange: (slug: string) => void;
  value: string;
};

/**
 * 공용 에디터에서 사용하는 slug 입력 필드입니다.
 * 허용되지 않는 문자는 입력 시 즉시 제거하고, 잠금 상태를 시각적으로 표시합니다.
 */
export const SlugInput = ({ className, isPublished = false, onChange, value }: SlugInputProps) => {
  const hasError = value.trim().length === 0;

  return (
    <div className={cx(rootClass, className)}>
      <label className={labelClass} htmlFor="editor-slug-input">
        슬러그
      </label>
      <div className={fieldWrapClass}>
        <Input
          aria-describedby="editor-slug-help editor-slug-error"
          aria-invalid={hasError}
          aria-label="슬러그"
          className={cx(inputClass, isPublished ? lockedInputClass : undefined)}
          id="editor-slug-input"
          onChange={event => onChange(normalizeSlugInput(event.target.value))}
          placeholder="example-slug"
          readOnly={isPublished}
          type="text"
          value={value}
        />
        {isPublished ? (
          <span aria-hidden className={lockIconClass}>
            <LockIcon color="muted" size="md" />
          </span>
        ) : null}
      </div>
      <p className={helpTextClass} id="editor-slug-help">
        {isPublished
          ? '발행 후에는 슬러그를 변경할 수 없습니다.'
          : '영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.'}
      </p>
      {hasError ? (
        <p className={errorTextClass} id="editor-slug-error" role="alert">
          슬러그를 입력해주세요.
        </p>
      ) : null}
    </div>
  );
};

const rootClass = css({
  display: 'grid',
  gap: '2',
});

const labelClass = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'text',
});

const fieldWrapClass = css({
  position: 'relative',
});

const inputClass = css({
  paddingRight: '10',
});

const lockedInputClass = css({
  background: 'surfaceMuted',
});

const lockIconClass = css({
  position: 'absolute',
  right: '3',
  top: '[50%]',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
});

const helpTextClass = css({
  fontSize: 'sm',
  color: 'muted',
});

const errorTextClass = css({
  fontSize: 'sm',
  color: 'error',
});
