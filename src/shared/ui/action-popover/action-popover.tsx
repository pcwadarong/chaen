'use client';

import React, { type ReactNode } from 'react';
import { css } from 'styled-system/css';

import { Button } from '@/shared/ui/button/button';
import { KebabIcon } from '@/shared/ui/icons/app-icons';
import { Popover } from '@/shared/ui/popover/popover';

type ActionPopoverRenderArgs = {
  closePopover: () => void;
};

type ActionPopoverProps = {
  children: ReactNode | ((args: ActionPopoverRenderArgs) => ReactNode);
  isOpen: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  panelLabel: string;
  triggerLabel: string;
};

type ActionMenuButtonProps = {
  ariaDisabled?: boolean;
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
};

/**
 * kebab 버튼으로 여는 공용 액션 팝오버 셸입니다.
 */
export const ActionPopover = ({
  children,
  isOpen,
  onOpenChange,
  panelLabel,
  triggerLabel,
}: ActionPopoverProps) => (
  <Popover
    isOpen={isOpen}
    onOpenChange={onOpenChange}
    panelClassName={panelClass}
    panelLabel={panelLabel}
    triggerAriaLabel={triggerLabel}
    triggerClassName={triggerClass}
    triggerContent={<KebabIcon aria-hidden color="muted" size="sm" />}
  >
    {children}
  </Popover>
);

/**
 * 액션 팝오버와 액션 행에서 공통으로 사용하는 버튼입니다.
 */
export const ActionMenuButton = ({
  ariaDisabled = false,
  icon,
  label,
  onClick,
}: ActionMenuButtonProps) => (
  <Button
    aria-disabled={ariaDisabled ? 'true' : undefined}
    className={actionButtonClass}
    leadingVisual={icon ? <span aria-hidden>{icon}</span> : undefined}
    onClick={ariaDisabled ? undefined : onClick}
    type="button"
    variant="ghost"
  >
    {label}
  </Button>
);

const triggerClass = css({
  border: '[0]',
  background: 'transparent',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '8',
  height: '8',
  borderRadius: 'full',
  transition: 'colors',
});

const panelClass = css({
  position: 'absolute',
  top: '[calc(100% + 0.4rem)]',
  right: '0',
  minWidth: '[8.5rem]',
  display: 'grid',
  borderRadius: '2xl',
  border: '[1px solid var(--colors-border)]',
  backgroundColor: 'surface',
  boxShadow: 'floating',
  zIndex: '20',
});

const actionButtonClass = css({
  color: 'muted',
  display: 'inline-flex',
  justifyContent: 'flex-start',
  transition: 'colors',
  _hover: {
    color: 'primary',
  },
  _focusVisible: {
    color: 'primary',
  },
});
