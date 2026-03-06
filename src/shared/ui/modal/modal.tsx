'use client';

import { css } from '@emotion/react';
import React, { type ReactNode, type RefObject, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useDialogFocusManagement } from '@/shared/lib/react/use-dialog-focus-management';

type ModalProps = {
  ariaDescribedBy?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  children: ReactNode;
  closeAriaLabel: string;
  frameStyle?: ReturnType<typeof css>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
};

/**
 * 공통 포털 모달입니다.
 * 어두운 배경, 우측 상단 닫기 버튼, 배경 클릭 닫기 동작을 기본으로 제공합니다.
 */
export const Modal = ({
  ariaDescribedBy,
  ariaLabel,
  ariaLabelledBy,
  children,
  closeAriaLabel,
  frameStyle,
  initialFocusRef,
  isOpen,
  onClose,
}: ModalProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !isMounted) return;

    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = bodyOverflow;
    };
  }, [isMounted, isOpen]);

  useDialogFocusManagement({
    containerRef: frameRef,
    initialFocusRef,
    isEnabled: isOpen && isMounted,
    onEscape: onClose,
  });

  if (!isMounted || !isOpen) return null;

  return createPortal(
    <div
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
      css={backdropStyle}
    >
      <div
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-modal="true"
        ref={frameRef}
        role="dialog"
        tabIndex={-1}
        css={[frameBaseStyle, frameStyle]}
      >
        <button aria-label={closeAriaLabel} onClick={onClose} css={closeButtonStyle} type="button">
          ×
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
};

const backdropStyle = css`
  position: fixed;
  inset: 0;
  z-index: 1200;
  background-color: rgb(var(--color-black) / 0.86);
  display: grid;
  place-items: center;
  padding: var(--space-4);
`;

const frameBaseStyle = css`
  position: relative;
`;

const closeButtonStyle = css`
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  z-index: 10;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--color-white) / 0.3);
  background-color: rgb(var(--color-black) / 0.5);
  color: rgb(var(--color-white));
  font-size: var(--font-size-20);
  line-height: var(--line-height-100);
  cursor: pointer;
`;
