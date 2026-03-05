'use client';

import { css } from '@emotion/react';
import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
  children: ReactNode;
  closeAriaLabel: string;
  frameStyle?: ReturnType<typeof css>;
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
      css={backdropStyle}
    >
      <div css={[frameBaseStyle, frameStyle]}>
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
  background-color: rgb(0 0 0 / 0.86);
  display: grid;
  place-items: center;
  padding: 1rem;
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
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / 0.3);
  background-color: rgb(0 0 0 / 0.5);
  color: rgb(255 255 255);
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
`;
