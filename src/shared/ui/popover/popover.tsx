'use client';

import React, { type ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react';
import { css, cx } from 'styled-system/css';

import { useDialogFocusManagement } from '@/shared/lib/react/use-dialog-focus-management';
import { Button } from '@/shared/ui/button/button';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

type PopoverRenderArgs = {
  closePopover: () => void;
};

type PopoverProps = {
  children: ReactNode | ((args: PopoverRenderArgs) => ReactNode);
  isOpen?: boolean;
  label?: string;
  onOpenChange?: (nextOpen: boolean) => void;
  panelClassName?: string;
  panelLabel: string;
  triggerAriaLabel?: string;
  triggerClassName?: string;
  triggerContent?: ReactNode;
  value?: string;
};

/**
 * 클릭 트리거와 다이얼로그 패널을 묶는 공용 팝오버 셸입니다.
 * controlled/uncontrolled 두 모드를 모두 지원합니다.
 */
export const Popover = ({
  children,
  isOpen: controlledIsOpen,
  label,
  onOpenChange,
  panelClassName,
  panelLabel,
  triggerAriaLabel,
  triggerClassName,
  triggerContent,
  value,
}: PopoverProps) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === 'boolean';
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();
  const panelLabelId = useId();
  const triggerLabelId = useId();
  const valueId = useId();
  const resolvedTriggerLabel = triggerAriaLabel ?? panelLabel;
  const usesSharedLabel = resolvedTriggerLabel === panelLabel;

  /**
   * controlled/uncontrolled 여부에 맞춰 열림 상태를 갱신합니다.
   */
  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledIsOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    if (!isOpen) return;

    /**
     * 팝오버 바깥을 누르면 패널을 닫습니다.
     */
    const handleOutsideInteraction = (event: Event) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener('click', handleOutsideInteraction);
    window.addEventListener('pointerdown', handleOutsideInteraction);

    return () => {
      window.removeEventListener('click', handleOutsideInteraction);
      window.removeEventListener('pointerdown', handleOutsideInteraction);
    };
  }, [isOpen, setOpen]);

  useDialogFocusManagement({
    containerRef: panelRef,
    initialFocusRef: undefined,
    isEnabled: isOpen,
    onEscape: () => {
      setOpen(false);
    },
  });

  /**
   * 패널을 닫습니다.
   */
  const closePopover = () => {
    setOpen(false);
  };

  return (
    <div className={rootClass} ref={rootRef}>
      <span className={srOnlyClass} id={panelLabelId}>
        {panelLabel}
      </span>
      {!usesSharedLabel ? (
        <span className={srOnlyClass} id={triggerLabelId}>
          {resolvedTriggerLabel}
        </span>
      ) : null}
      <Button
        aria-controls={isOpen ? panelId : undefined}
        aria-describedby={!triggerContent && value ? valueId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-labelledby={usesSharedLabel ? panelLabelId : triggerLabelId}
        className={cx(triggerButtonClass, triggerClassName)}
        onClick={() => setOpen(!isOpen)}
        size="sm"
        tone="white"
        type="button"
        variant="ghost"
      >
        {triggerContent ? (
          triggerContent
        ) : (
          <>
            <span className={triggerLabelClass}>{label}</span>
            <span className={triggerValueClass} id={valueId}>
              {value}
            </span>
          </>
        )}
      </Button>
      {isOpen ? (
        <div
          aria-labelledby={panelLabelId}
          className={cx(panelClass, panelClassName)}
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

const rootClass = css({
  position: 'relative',
});

const triggerButtonClass = css({
  _hover: {
    color: 'primary',
  },
  _focusVisible: {
    color: 'primary',
  },
});

const triggerLabelClass = css({
  fontSize: 'xs',
  fontWeight: 'bold',
  letterSpacing: '[0.12em]',
  textTransform: 'uppercase',
  color: 'muted',
});

const triggerValueClass = css({
  fontSize: 'sm',
  color: 'text',
});

const panelClass = css({
  position: 'absolute',
  top: '[calc(100% + 0.55rem)]',
  right: '0',
  minWidth: '48',
  p: '2',
  borderRadius: '2xl',
  border: '[1px solid var(--colors-border)]',
  backgroundColor: 'surface',
  boxShadow: 'floating',
  display: 'grid',
  gap: '1',
  zIndex: '30',
});
