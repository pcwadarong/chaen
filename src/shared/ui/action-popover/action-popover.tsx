'use client';

import { css } from '@emotion/react';
import React, { type ReactNode, useCallback, useEffect, useId, useRef } from 'react';

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
    <div ref={rootRef} css={rootStyle}>
      <button
        aria-controls={isOpen ? panelId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={triggerLabel}
        css={triggerStyle}
        onClick={() => onOpenChange(!isOpen)}
        type="button"
      >
        <KebabIcon aria-hidden color="muted" size="sm" />
      </button>
      {isOpen ? (
        <div
          aria-label={panelLabel}
          css={panelStyle}
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
    css={actionButtonStyle}
    onClick={ariaDisabled ? undefined : onClick}
    type="button"
  >
    {icon ? (
      <span aria-hidden css={iconStyle}>
        {icon}
      </span>
    ) : null}
    <span>{label}</span>
  </button>
);

const rootStyle = css`
  position: relative;
`;

const triggerStyle = css`
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-pill);
  transition:
    background-color 160ms ease,
    box-shadow 160ms ease;

  &:hover,
  &:focus-visible {
    outline: none;
    background: rgb(var(--color-primary) / 0.08);
    box-shadow: 0 0 0 3px rgb(var(--color-primary) / 0.12);
  }
`;

const panelStyle = css`
  position: absolute;
  top: calc(100% + 0.4rem);
  right: 0;
  min-width: 8.5rem;
  padding: var(--space-2);
  display: grid;
  gap: var(--space-1);
  border-radius: var(--radius-md);
  border: 1px solid rgb(var(--color-border) / 0.22);
  background-color: rgb(var(--color-surface) / 0.98);
  box-shadow: 0 18px 42px rgb(var(--color-black) / 0.12);
  z-index: 20;
`;

const actionButtonStyle = css`
  border: 0;
  background: transparent;
  color: rgb(var(--color-muted));
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-13);
  transition:
    color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease;

  &:hover:not([aria-disabled='true']),
  &:focus-visible:not([aria-disabled='true']) {
    outline: none;
    color: rgb(var(--color-primary));
    background: rgb(var(--color-primary) / 0.08);
    box-shadow: 0 0 0 3px rgb(var(--color-primary) / 0.12);
  }

  &[aria-disabled='true'] {
    cursor: default;
    opacity: 0.72;
  }
`;

const iconStyle = css`
  display: inline-flex;
`;
