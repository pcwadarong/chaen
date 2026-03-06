'use client';

import { css } from '@emotion/react';
import React, { useLayoutEffect, useRef } from 'react';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  autoResize?: boolean;
};

/**
 * textarea 높이를 현재 내용 줄 수에 맞게 다시 계산합니다.
 */
const resizeTextarea = (element: HTMLTextAreaElement) => {
  element.style.height = '0px';
  element.style.height = `${element.scrollHeight}px`;
};

/**
 * 공통 여러 줄 입력 컴포넌트입니다.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ autoResize = true, onChange, rows = 1, style, ...props }, ref) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    useLayoutEffect(() => {
      if (!autoResize || !innerRef.current) return;

      resizeTextarea(innerRef.current);
    }, [autoResize, props.value]);

    const handleRef = (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;

      if (!ref) return;

      if (typeof ref === 'function') {
        ref(node);
        return;
      }

      ref.current = node;
    };

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        resizeTextarea(event.currentTarget);
      }

      onChange?.(event);
    };

    return (
      <textarea
        {...props}
        ref={handleRef}
        rows={rows}
        onChange={handleChange}
        css={[textareaStyle, autoResize ? autoResizeStyle : undefined]}
        style={style}
      />
    );
  },
);

Textarea.displayName = 'Textarea';

const textareaStyle = css`
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid rgb(var(--color-border) / 0.3);
  background-color: rgb(var(--color-surface));
  color: rgb(var(--color-text));
  resize: vertical;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease;

  &::placeholder {
    color: rgb(var(--color-muted));
  }

  &:hover:not(:disabled) {
    border-color: rgb(var(--color-border) / 0.44);
  }

  &:focus-visible {
    outline: none;
    border-color: rgb(var(--color-primary) / 0.42);
    box-shadow: 0 0 0 3px rgb(var(--color-primary) / 0.14);
  }

  &:disabled,
  &[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.56;
  }
`;

const autoResizeStyle = css`
  resize: none;
  overflow: hidden;
`;
