'use client';

import React from 'react';
import { css } from 'styled-system/css';

import { Modal } from '@/shared/ui/modal/modal';

/**
 * Modal의 브라우저 포커스 및 닫힘 계약을 검증하기 위한 fixture입니다.
 */
export const ModalE2eFixture = () => {
  const [closeCount, setCloseCount] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);
  const initialFocusRef = React.useRef<HTMLInputElement>(null);

  return (
    <main className={pageClass}>
      <section className={panelClass}>
        <h1 className={titleClass}>Modal Fixture</h1>
        <p className={descriptionClass}>
          실제 브라우저에서 초기 포커스, Tab 순환, Escape 닫힘과 포커스 복원을 검증한다.
        </p>
        <div className={actionRowClass}>
          <button
            className={triggerButtonClass}
            onClick={() => {
              setIsOpen(true);
            }}
            type="button"
          >
            모달 열기
          </button>
          <output aria-live="polite" className={statusClass} data-testid="modal-close-count">
            closeCount:{closeCount}
          </output>
        </div>
      </section>
      <Modal
        closeAriaLabel="닫기"
        initialFocusRef={initialFocusRef}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setCloseCount(previousCount => previousCount + 1);
        }}
      >
        <div className={modalBodyClass}>
          <label className={fieldClass}>
            <span className={fieldLabelClass}>비밀번호</span>
            <input className={inputClass} ref={initialFocusRef} type="password" />
          </label>
          <div className={buttonRowClass}>
            <button className={innerButtonClass} type="button">
              첫 번째
            </button>
            <button className={innerButtonClass} type="button">
              마지막
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
};

const pageClass = css({
  minHeight: 'svh',
  display: 'grid',
  alignContent: 'start',
  gap: '6',
  px: '4',
  py: '6',
  background:
    '[linear-gradient(180deg, color-mix(in srgb, #5d5bff 12%, white) 0%, color-mix(in srgb, #5d5bff 2%, white) 100%)]',
});

const panelClass = css({
  display: 'grid',
  gap: '3',
  maxWidth: '[44rem]',
  p: '5',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderColor: 'border',
  background: 'surface',
});

const titleClass = css({
  fontSize: '[clamp(2rem, 5vw, 3rem)]',
  lineHeight: 'none',
  letterSpacing: '[-0.04em]',
  fontWeight: 'semibold',
});

const descriptionClass = css({
  fontSize: 'md',
  color: 'muted',
});

const actionRowClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',
  alignItems: 'center',
});

const triggerButtonClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '11',
  px: '5',
  borderRadius: 'full',
  backgroundColor: 'text',
  color: 'surface',
  fontWeight: 'medium',
});

const statusClass = css({
  fontSize: 'sm',
  color: 'muted',
});

const modalBodyClass = css({
  width: '[min(28rem, calc(100vw - 2rem))]',
  display: 'grid',
  gap: '4',
  p: '6',
  borderRadius: '3xl',
  background: 'surface',
});

const fieldClass = css({
  display: 'grid',
  gap: '2',
});

const fieldLabelClass = css({
  fontSize: 'sm',
  fontWeight: 'medium',
});

const inputClass = css({
  minHeight: '11',
  px: '3',
  borderRadius: 'xl',
  borderWidth: '1px',
  borderColor: 'border',
  background: 'bg',
});

const buttonRowClass = css({
  display: 'flex',
  gap: '3',
});

const innerButtonClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '10',
  px: '4',
  borderRadius: 'full',
  borderWidth: '1px',
  borderColor: 'border',
  background: 'bg',
});
