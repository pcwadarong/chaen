import React from 'react';
import { cva, cx } from 'styled-system/css';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * 공통 단일행 입력 컴포넌트입니다.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input {...props} className={cx(inputRecipe(), className)} ref={ref} />
  ),
);

Input.displayName = 'Input';

/**
 * 공통 단일행 입력 필드 스타일을 정의합니다.
 */
const inputRecipe = cva({
  base: {
    width: 'full',
    minHeight: '[2.75rem]',
    px: '3',
    py: '2',
    borderRadius: 'md',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    backgroundColor: 'surface',
    color: 'text',
    transition: 'colors',
    _placeholder: {
      color: 'muted',
    },
    _hover: {
      borderColor: 'borderStrong',
    },
    _focusVisible: {
      outline: '[2px solid var(--colors-focus-ring)]',
      outlineOffset: '[2px]',
      borderColor: 'primary',
    },
    _disabled: {
      cursor: 'not-allowed',
      opacity: 0.56,
    },
    '&[aria-disabled="true"]': {
      cursor: 'not-allowed',
      opacity: 0.56,
    },
  },
});
