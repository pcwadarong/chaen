'use client';

import React, { useLayoutEffect, useRef } from 'react';
import { cx } from 'styled-system/css';

import { textareaRecipe } from '@/shared/ui/textarea/textarea.recipe';

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
  ({ autoResize = true, className, onChange, rows = 1, style, ...props }, ref) => {
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
        className={cx(textareaRecipe({ autoResize }), className)}
        onChange={handleChange}
        ref={handleRef}
        rows={rows}
        style={style}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
