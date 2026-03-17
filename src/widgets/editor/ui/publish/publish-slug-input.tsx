'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { css, cx } from 'styled-system/css';

import { isValidSlugFormat, normalizeSlugInput } from '@/shared/lib/slug/slug';
import { Button } from '@/shared/ui/button/button';
import { LockIcon } from '@/shared/ui/icons/app-icons';
import { Input } from '@/shared/ui/input/input';

type PublishSlugInputProps = {
  className?: string;
  isPublished?: boolean;
  onChange: (slug: string) => void;
  onCheckDuplicate?: (slug: string) => Promise<boolean>;
  showEmptyError?: boolean;
  value: string;
};

/**
 * 발행 패널에서 사용하는 slug 입력 필드입니다.
 * 허용되지 않는 문자는 입력 시 즉시 제거하고, 잠금 상태를 시각적으로 표시합니다.
 */
export const PublishSlugInput = ({
  className,
  isPublished = false,
  onChange,
  onCheckDuplicate,
  showEmptyError = false,
  value,
}: PublishSlugInputProps) => {
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const helpId = `${baseId}-help`;
  const errorId = `${baseId}-error`;
  const successId = `${baseId}-success`;
  const [hasCheckAttempt, setHasCheckAttempt] = useState(false);
  const [duplicateCheckStatus, setDuplicateCheckStatus] = useState<
    'available' | 'checking' | 'duplicate' | 'error' | 'idle'
  >('idle');
  const duplicateCheckRequestIdRef = useRef(0);
  const latestValueRef = useRef(value);
  const normalizedValue = normalizeSlugInput(value);
  const isEmpty = value.trim().length === 0;
  const hasFormatError = value.trim().length > 0 && !isValidSlugFormat(normalizedValue);
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

  latestValueRef.current = value;

  useEffect(() => {
    setHasCheckAttempt(false);
    setDuplicateCheckStatus('idle');
  }, [value]);

  /**
   * 입력한 문자열을 slug 형식으로 정규화한 뒤 사용 가능 여부를 확인합니다.
   */
  const handleDuplicateCheck = async () => {
    setHasCheckAttempt(true);

    if (isEmpty || hasFormatError || !onCheckDuplicate) return;

    const requestId = ++duplicateCheckRequestIdRef.current;
    const requestSlug = normalizedValue;
    setDuplicateCheckStatus('checking');

    try {
      const isDuplicate = await onCheckDuplicate(requestSlug);

      if (
        duplicateCheckRequestIdRef.current !== requestId ||
        normalizeSlugInput(latestValueRef.current) !== requestSlug
      ) {
        return;
      }

      onChange(requestSlug);
      setDuplicateCheckStatus(isDuplicate ? 'duplicate' : 'available');
    } catch {
      if (
        duplicateCheckRequestIdRef.current !== requestId ||
        normalizeSlugInput(latestValueRef.current) !== requestSlug
      ) {
        return;
      }

      setDuplicateCheckStatus('error');
    }
  };

  return (
    <div className={cx(rootClass, className)}>
      <label className={labelClass} htmlFor={inputId}>
        Url
      </label>
      <div className={fieldRowClass}>
        <div className={fieldWrapClass}>
          <Input
            aria-describedby={
              errorMessage
                ? `${helpId} ${errorId}`
                : successMessage
                  ? `${helpId} ${successId}`
                  : helpId
            }
            aria-invalid={Boolean(errorMessage) || undefined}
            aria-label="슬러그"
            className={cx(inputClass, isPublished ? lockedInputClass : undefined)}
            id={inputId}
            onChange={event => onChange(event.target.value)}
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
          <Button
            disabled={duplicateCheckStatus === 'checking'}
            onClick={() => void handleDuplicateCheck()}
            size="sm"
            tone="black"
            type="button"
            variant="solid"
          >
            {duplicateCheckStatus === 'checking' ? '확인 중...' : '사용 가능 확인'}
          </Button>
        ) : null}
      </div>
      <p className={helpTextClass} id={helpId}>
        {isPublished
          ? '발행 후에는 슬러그를 변경할 수 없습니다.'
          : '원하는 문구를 입력한 뒤 사용 가능 확인을 해주세요.'}
      </p>
      {errorMessage ? (
        <p className={errorTextClass} id={errorId} role="alert">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className={successTextClass} id={successId} role="status">
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
  flex: '1',
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

const fieldRowClass = css({
  display: 'flex',
  alignItems: 'stretch',
  gap: '3',
  '& button': {
    flex: 'none',
  },
});

const errorTextClass = css({
  fontSize: 'sm',
  color: 'error',
});

const successTextClass = css({
  fontSize: 'sm',
  color: 'success',
});
