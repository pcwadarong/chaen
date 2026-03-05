'use client';

import { css } from '@emotion/react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

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

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

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
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={panelLabel}
        onClick={handleToggle}
        css={triggerStyle}
        type="button"
      >
        <span css={triggerLabelStyle}>{label}</span>
        <span css={triggerValueStyle}>{value}</span>
      </button>
      {isOpen ? (
        <div aria-label={panelLabel} role="dialog" css={panelStyle}>
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
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--color-border) / 0.24);
  background-color: rgb(var(--color-surface) / 0.84);
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
`;

const triggerLabelStyle = css`
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--color-muted));
`;

const triggerValueStyle = css`
  font-size: 0.92rem;
  color: rgb(var(--color-text));
`;

const panelStyle = css`
  position: absolute;
  top: calc(100% + 0.55rem);
  right: 0;
  min-width: 12rem;
  padding: 0.45rem;
  border-radius: var(--radius-md);
  border: 1px solid rgb(var(--color-border) / 0.22);
  background-color: rgb(var(--color-surface) / 0.98);
  box-shadow: 0 18px 42px rgb(0 0 0 / 0.12);
  display: grid;
  gap: 0.25rem;
  z-index: 30;
`;
