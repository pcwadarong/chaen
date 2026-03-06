'use client';

import { css } from '@emotion/react';
import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * 공통 단일행 입력 컴포넌트입니다.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <input {...props} ref={ref} css={inputStyle} />
));

Input.displayName = 'Input';

const inputStyle = css`
  width: 100%;
  min-height: 2.75rem;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid rgb(var(--color-border) / 0.3);
  background-color: rgb(var(--color-surface));
  color: rgb(var(--color-text));
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
