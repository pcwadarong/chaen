'use client';

import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
  children: ReactNode;
  closeAriaLabel: string;
  frameStyle?: CSSProperties;
  isOpen: boolean;
  onClose: () => void;
};

/**
 * 공통 포털 모달입니다.
 * 어두운 배경, 우측 상단 닫기 버튼, 배경 클릭 닫기 동작을 기본으로 제공합니다.
 */
export const Modal = ({ children, closeAriaLabel, frameStyle, isOpen, onClose }: ModalProps) => {
  const [isMounted, setIsMounted] = useState(false);

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

  useEffect(() => {
    if (!isOpen || !isMounted) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isMounted, isOpen, onClose]);

  if (!isMounted || !isOpen) return null;

  return createPortal(
    <div
      aria-modal="true"
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      style={backdropStyle}
    >
      <div style={{ ...frameBaseStyle, ...frameStyle }}>
        <button
          aria-label={closeAriaLabel}
          onClick={onClose}
          style={closeButtonStyle}
          type="button"
        >
          ×
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
};

const backdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1200,
  backgroundColor: 'rgb(0 0 0 / 0.86)',
  display: 'grid',
  placeItems: 'center',
  padding: '1rem',
};

const frameBaseStyle: CSSProperties = {
  position: 'relative',
};

const closeButtonStyle: CSSProperties = {
  position: 'absolute',
  top: '0.65rem',
  right: '0.65rem',
  zIndex: 10,
  width: '2.4rem',
  height: '2.4rem',
  borderRadius: '999px',
  border: '1px solid rgb(255 255 255 / 0.3)',
  backgroundColor: 'rgb(0 0 0 / 0.5)',
  color: 'rgb(255 255 255)',
  fontSize: '1.2rem',
  lineHeight: 1,
  cursor: 'pointer',
};
