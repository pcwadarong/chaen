'use client';

import { css } from '@emotion/react';
import React from 'react';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * 공통 여러 줄 입력 컴포넌트입니다.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => (
  <textarea {...props} ref={ref} css={textareaStyle} />
));

Textarea.displayName = 'Textarea';

const textareaStyle = css`
  width: 100%;
  min-height: 8.5rem;
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
