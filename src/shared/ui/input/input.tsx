import React from 'react';
import { cx } from 'styled-system/css';

import { inputRecipe } from '@/shared/ui/input/input.recipe';

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
