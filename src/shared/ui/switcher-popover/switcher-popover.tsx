'use client';

import React, { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { css } from 'styled-system/css';

import { useDialogFocusManagement } from '@/shared/lib/react/use-dialog-focus-management';
import { Button } from '@/shared/ui/button/button';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

type SwitcherPopoverProps = {
  children: (args: { closePopover: () => void }) => ReactNode;
  label: string;
  panelLabel: string;
  triggerContent?: ReactNode;
  value?: string;
};

/**
 * 헤더 스위처에서 공통으로 사용하는 팝오버 셸입니다.
 */
export const SwitcherPopover = ({
  children,
  label,
  panelLabel,
  triggerContent,
  value,
}: SwitcherPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();
  const panelLabelId = useId();
  const valueId = useId();

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('click', handleDocumentClick);

    return () => {
      window.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  useDialogFocusManagement({
    containerRef: panelRef,
    initialFocusRef: undefined,
    isEnabled: isOpen,
    onEscape: () => {
      setIsOpen(false);
    },
  });

  /**
   * 패널 열림 상태를 토글합니다.
   */
  const handleToggle = () => {
    setIsOpen(open => !open);
  };

  /**
   * 패널을 닫습니다.
   */
  const closePopover = () => {
    setIsOpen(false);
  };

  return (
    <div className={rootClass} ref={rootRef}>
      <span className={srOnlyClass} id={panelLabelId}>
        {panelLabel}
      </span>
      <Button
        aria-controls={isOpen ? panelId : undefined}
        aria-describedby={!triggerContent && value ? valueId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-labelledby={panelLabelId}
        className={triggerButtonClass}
        onClick={handleToggle}
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
          id={panelId}
          ref={panelRef}
          role="dialog"
          tabIndex={-1}
          className={panelClass}
        >
          {children({ closePopover })}
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
  boxShadow: '[0 18px 42px rgb(15 23 42 / 0.12)]',
  display: 'grid',
  gap: '1',
  zIndex: '30',
});
