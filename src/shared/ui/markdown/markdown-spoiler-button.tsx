'use client';

import React, { useState } from 'react';
import { css, cx } from 'styled-system/css';

type MarkdownSpoilerButtonProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * keyboard/touch로도 열고 닫을 수 있는 markdown spoiler 버튼입니다.
 */
export const MarkdownSpoilerButton = ({ children, className }: MarkdownSpoilerButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const statusId = React.useId();

  return (
    <>
      <button
        aria-describedby={statusId}
        aria-expanded={isOpen}
        className={cx(spoilerButtonClass, isOpen ? spoilerButtonOpenClass : undefined, className)}
        onClick={() => setIsOpen(open => !open)}
        type="button"
      >
        {children}
      </button>
      <span aria-live="polite" className={srOnlyClass} id={statusId} role="status">
        {isOpen ? '스포일러가 열렸습니다.' : '숨겨진 내용입니다. 버튼을 눌러 표시할 수 있습니다.'}
      </span>
    </>
  );
};

const spoilerButtonClass = css({
  display: 'inline',
  px: '[0.25rem]',
  py: '[0.08rem]',
  border: '[0]',
  borderRadius: '[0.35rem]',
  background: '[rgba(100, 116, 139, 0.2)]',
  color: 'transparent',
  cursor: 'pointer',
  textShadow: '[0 0 0 transparent]',
  transition: '[color 160ms ease]',
  _hover: {
    color: 'text',
  },
  _focusVisible: {
    color: 'text',
    outline: '[2px solid var(--colors-primary)]',
    outlineOffset: '[2px]',
  },
});

const spoilerButtonOpenClass = css({
  color: 'text',
});

const srOnlyClass = css({
  position: 'absolute',
  width: '[1px]',
  height: '[1px]',
  p: '0',
  m: '[-1px]',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '[0]',
});
