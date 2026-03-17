'use client';

import React from 'react';
import { css, cx } from 'styled-system/css';

import { Button } from '@/shared/ui/button/button';
import { Tooltip } from '@/shared/ui/tooltip/tooltip';

type ToolbarActionButtonProps = {
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
  onClick: () => void;
};

/**
 * compact markdown toolbar에서 공통으로 쓰는 아이콘/토큰 버튼입니다.
 * 클릭 전에 textarea selection이 흐트러지지 않도록 mousedown 기본 동작을 막습니다.
 */
export const ToolbarActionButton = ({
  ariaLabel,
  children,
  className,
  onClick,
}: ToolbarActionButtonProps) => (
  <Tooltip content={ariaLabel}>
    <Button
      aria-label={ariaLabel}
      className={cx(actionButtonClass, className)}
      onClick={onClick}
      onMouseDown={event => event.preventDefault()}
      size="sm"
      tone="white"
      type="button"
      variant="ghost"
    >
      {children}
    </Button>
  </Tooltip>
);

const actionButtonClass = css({
  minWidth: '9',
  minHeight: '9',
  width: '9',
  height: '9',
  px: '0',
  borderRadius: 'lg',
  borderColor: 'border',
});
