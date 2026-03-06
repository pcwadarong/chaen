'use client';

import { css } from '@emotion/react';
import React, { type ReactNode, useEffect, useId, useRef, useState } from 'react';

import { useDialogFocusManagement } from '@/shared/lib/react/use-dialog-focus-management';
import { srOnlyStyle } from '@/shared/ui/styles/sr-only-style';

type SwitcherPopoverProps = {
  children: (args: { closePopover: () => void }) => ReactNode;
  label: string;
  panelLabel: string;
  value: string;
};

/**
 * 헤더 스위처에서 공통으로 사용하는 팝오버 셸입니다.
 */
export const SwitcherPopover = ({ children, label, panelLabel, value }: SwitcherPopoverProps) => {
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
    <div ref={rootRef} css={rootStyle}>
      <span id={panelLabelId} css={srOnlyStyle}>
        {panelLabel}
      </span>
      <button
        aria-controls={isOpen ? panelId : undefined}
        aria-describedby={valueId}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-labelledby={panelLabelId}
        onClick={handleToggle}
        css={triggerStyle}
        type="button"
      >
        <span css={triggerLabelStyle}>{label}</span>
        <span id={valueId} css={triggerValueStyle}>
          {value}
        </span>
      </button>
      {isOpen ? (
        <div
          aria-labelledby={panelLabelId}
          id={panelId}
          ref={panelRef}
          role="dialog"
          tabIndex={-1}
          css={panelStyle}
        >
          {children({ closePopover })}
        </div>
      ) : null}
    </div>
  );
};

const rootStyle = css`
  position: relative;
`;

const triggerStyle = css`
  min-height: 2.5rem;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--color-border) / 0.24);
  background-color: rgb(var(--color-surface) / 0.84);
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
`;

const triggerLabelStyle = css`
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--color-muted));
`;

const triggerValueStyle = css`
  font-size: var(--font-size-14);
  color: rgb(var(--color-text));
`;

const panelStyle = css`
  position: absolute;
  top: calc(100% + 0.55rem);
  right: 0;
  min-width: 12rem;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid rgb(var(--color-border) / 0.22);
  background-color: rgb(var(--color-surface) / 0.98);
  box-shadow: 0 18px 42px rgb(var(--color-black) / 0.12);
  display: grid;
  gap: var(--space-1);
  z-index: 30;
`;
