'use client';

import React, { useEffect, useState } from 'react';
import { css, cx } from 'styled-system/css';

import { isValidSlugFormat, normalizeSlugInput } from '@/shared/lib/editor/slug';
import { Button } from '@/shared/ui/button/button';
import { LockIcon } from '@/shared/ui/icons/app-icons';
import { Input } from '@/shared/ui/input/input';

type SlugInputProps = {
  className?: string;
  isPublished?: boolean;
  onChange: (slug: string) => void;
  onCheckDuplicate?: (slug: string) => Promise<boolean>;
  showEmptyError?: boolean;
  value: string;
};

/**
 * 공용 에디터에서 사용하는 slug 입력 필드입니다.
 * 허용되지 않는 문자는 입력 시 즉시 제거하고, 잠금 상태를 시각적으로 표시합니다.
 */
export const SlugInput = ({
  className,
  isPublished = false,
  onChange,
  onCheckDuplicate,
  showEmptyError = false,
  value,
}: SlugInputProps) => {
  const [hasCheckAttempt, setHasCheckAttempt] = useState(false);
  const [duplicateCheckStatus, setDuplicateCheckStatus] = useState<
    'available' | 'checking' | 'duplicate' | 'error' | 'idle'
  >('idle');
  const isEmpty = value.trim().length === 0;
  const hasFormatError = value.length > 0 && !isValidSlugFormat(value);
  const shouldShowEmptyError = (showEmptyError || hasCheckAttempt) && isEmpty;
  const shouldShowFormatError = hasCheckAttempt && hasFormatError;
  const errorMessage = shouldShowEmptyError
    ? '슬러그를 입력해주세요.'
    : shouldShowFormatError
      ? '슬러그는 하이픈 앞뒤에 영문 소문자 또는 숫자가 있어야 합니다.'
      : duplicateCheckStatus === 'duplicate'
        ? '이미 사용 중인 슬러그입니다. 다른 슬러그를 사용해주세요.'
        : duplicateCheckStatus === 'error'
          ? '중복 확인에 실패했습니다. 잠시 후 다시 시도해주세요.'
          : null;
  const successMessage = duplicateCheckStatus === 'available' ? '사용 가능한 슬러그입니다.' : null;

  useEffect(() => {
    setHasCheckAttempt(false);
    setDuplicateCheckStatus('idle');
  }, [value]);

  /**
   * 별도 버튼으로 slug 중복 여부를 확인합니다.
   */
  const handleDuplicateCheck = async () => {
    setHasCheckAttempt(true);

    if (isEmpty || hasFormatError || !onCheckDuplicate) return;

    setDuplicateCheckStatus('checking');

    try {
      const isDuplicate = await onCheckDuplicate(value);
      setDuplicateCheckStatus(isDuplicate ? 'duplicate' : 'available');
    } catch {
      setDuplicateCheckStatus('error');
    }
  };

  return (
    <div className={cx(rootClass, className)}>
      <label className={labelClass} htmlFor="editor-slug-input">
        슬러그
      </label>
      <div className={fieldWrapClass}>
        <Input
          aria-describedby={
            errorMessage
              ? 'editor-slug-help editor-slug-error'
              : successMessage
                ? 'editor-slug-help editor-slug-success'
                : 'editor-slug-help'
          }
          aria-invalid={Boolean(errorMessage) || undefined}
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
      {onCheckDuplicate && !isPublished ? (
        <div className={actionRowClass}>
          <Button
            disabled={duplicateCheckStatus === 'checking'}
            onClick={() => void handleDuplicateCheck()}
            size="sm"
            tone="white"
            type="button"
            variant="ghost"
          >
            {duplicateCheckStatus === 'checking' ? '확인 중...' : '중복 확인'}
          </Button>
        </div>
      ) : null}
      <p className={helpTextClass} id="editor-slug-help">
        {isPublished
          ? '발행 후에는 슬러그를 변경할 수 없습니다.'
          : '영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.'}
      </p>
      {errorMessage ? (
        <p className={errorTextClass} id="editor-slug-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className={successTextClass} id="editor-slug-success" role="status">
          {successMessage}
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

const actionRowClass = css({
  display: 'flex',
  justifyContent: 'flex-start',
});

const errorTextClass = css({
  fontSize: 'sm',
  color: 'error',
});

const successTextClass = css({
  fontSize: 'sm',
  color: 'success',
});
