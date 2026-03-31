'use client';

import React, { type ReactNode, type RefObject, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { css } from 'styled-system/css';

import { useDialogFocusManagement } from '@/shared/lib/react/use-dialog-focus-management';
import { XButton } from '@/shared/ui/x-button/x-button';

type ModalProps = {
  ariaDescribedBy?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  children: ReactNode;
  closeAriaLabel: string;
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
      className={backdropClass}
    >
      <div
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-modal="true"
        ref={frameRef}
        role="dialog"
        tabIndex={-1}
        className={frameBaseClass}
      >
        <XButton ariaLabel={closeAriaLabel} className={closeButtonClass} onClick={onClose} />
        {children}
      </div>
    </div>,
    document.body,
  );
};

const backdropClass = css({
  position: 'fixed',
  inset: '0',
  zIndex: '1200',
  backgroundColor: '[rgb(15 23 42 / 0.86)]',
  p: '4',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
});

const frameBaseClass = css({
  position: 'relative',
  borderRadius: '3xl',
  maxWidth: 'full',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: 'full',
  minWidth: '0',
  minHeight: '0',
  overflow: 'hidden',
});

const closeButtonClass = css({
  position: 'absolute',
  top: '[0.6rem]',
  right: '[0.5rem]',
  zIndex: '10',
  lineHeight: 'none',
});
