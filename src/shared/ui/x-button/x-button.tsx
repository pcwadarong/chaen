'use client';

import React from 'react';
import { css, cx } from 'styled-system/css';

import {
  Button,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
} from '@/shared/ui/button/button';

type XButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  ariaLabel: string;
  className?: string;
  glyphClassName?: string;
  size?: ButtonSize;
  tone?: ButtonTone;
  variant?: ButtonVariant;
};

/**
 * 닫기, 제거, 초기화처럼 X 아이콘만 필요한 버튼을 공통 규격으로 렌더링합니다.
 */
export const XButton = ({
  ariaLabel,
  className,
  glyphClassName,
  size = 'sm',
  tone = 'white',
  type = 'button',
  variant = 'ghost',
  ...props
}: XButtonProps) => (
  <Button
    aria-label={ariaLabel}
    className={className}
    size={size}
    tone={tone}
    type={type}
    variant={variant}
    {...props}
  >
    <span aria-hidden className={cx(glyphClass, glyphClassName)}>
      +
    </span>
  </Button>
);

const glyphClass = css({
  display: 'inline-block',
  fontSize: '3xl',
  lineHeight: 'none',
  transform: 'rotate(45deg)',
});
