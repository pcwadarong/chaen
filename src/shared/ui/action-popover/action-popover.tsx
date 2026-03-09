'use client';

import React, { type ReactNode, useCallback, useEffect, useId, useRef } from 'react';
import { css } from 'styled-system/css';

import { useDialogFocusManagement } from '@/shared/lib/react/use-dialog-focus-management';
import { KebabIcon } from '@/shared/ui/icons/app-icons';

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
}: ActionPopoverProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  /**
   * 외부 클릭이나 액션 실행 후 팝오버를 닫습니다.
   */
  const closePopover = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!isOpen) return;

    /**
     * 팝오버 바깥을 누르면 메뉴를 닫습니다.
     */
    const handleDocumentPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closePopover();
      }
    };

    window.addEventListener('pointerdown', handleDocumentPointerDown);

    return () => {
      window.removeEventListener('pointerdown', handleDocumentPointerDown);
    };
  }, [closePopover, isOpen]);

  useDialogFocusManagement({
    containerRef: panelRef,
    isEnabled: isOpen,
    onEscape: closePopover,
  });

  return (
    <div className={rootClass} ref={rootRef}>
      <button
        aria-controls={isOpen ? panelId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={triggerLabel}
        className={triggerClass}
        onClick={() => onOpenChange(!isOpen)}
        type="button"
      >
        <KebabIcon aria-hidden color="muted" size="sm" />
      </button>
      {isOpen ? (
        <div
          aria-label={panelLabel}
          className={panelClass}
          id={panelId}
          ref={panelRef}
          role="dialog"
          tabIndex={-1}
        >
          {typeof children === 'function' ? children({ closePopover }) : children}
        </div>
      ) : null}
    </div>
  );
};

/**
 * 액션 팝오버와 액션 행에서 공통으로 사용하는 버튼입니다.
 */
export const ActionMenuButton = ({
  ariaDisabled = false,
  icon,
  label,
  onClick,
}: ActionMenuButtonProps) => (
  <button
    aria-disabled={ariaDisabled ? 'true' : undefined}
    className={actionButtonClass}
    onClick={ariaDisabled ? undefined : onClick}
    type="button"
  >
    {icon ? (
      <span aria-hidden className={iconClass}>
        {icon}
      </span>
    ) : null}
    <span>{label}</span>
  </button>
);

const rootClass = css({
  position: 'relative',
});

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
  _hover: {
    outline: 'none',
    background: 'primarySubtle',
    boxShadow: '[0 0 0 3px var(--colors-focus-ring)]',
  },
  _focusVisible: {
    outline: 'none',
    background: 'primarySubtle',
    boxShadow: '[0 0 0 3px var(--colors-focus-ring)]',
  },
});

const panelClass = css({
  position: 'absolute',
  top: '[calc(100% + 0.4rem)]',
  right: '0',
  minWidth: '[8.5rem]',
  p: '2',
  display: 'grid',
  gap: '1',
  borderRadius: 'md',
  border: '[1px solid var(--colors-border)]',
  backgroundColor: 'surface',
  boxShadow: '[0 18px 42px rgb(15 23 42 / 0.12)]',
  zIndex: '20',
});

const actionButtonClass = css({
  border: '[0]',
  background: 'transparent',
  color: 'muted',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  px: '2',
  py: '1',
  borderRadius: 'full',
  fontSize: 'sm',
  transition: 'colors',
  _hover: {
    color: 'primary',
    background: 'primarySubtle',
    boxShadow: '[0 0 0 3px var(--colors-focus-ring)]',
  },
  _focusVisible: {
    outline: 'none',
    color: 'primary',
    background: 'primarySubtle',
    boxShadow: '[0 0 0 3px var(--colors-focus-ring)]',
  },
  '&[aria-disabled="true"]': {
    cursor: 'default',
    opacity: 0.72,
  },
});

const iconClass = css({
  display: 'inline-flex',
});
