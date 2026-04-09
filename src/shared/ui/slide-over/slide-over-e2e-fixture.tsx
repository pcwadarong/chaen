'use client';

import React from 'react';
import { css } from 'styled-system/css';

import { SlideOver } from '@/shared/ui/slide-over/slide-over';

/**
 * SlideOver의 브라우저 포커스와 닫힘 계약을 검증하기 위한 fixture입니다.
 */
export const SlideOverE2eFixture = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const initialFocusRef = React.useRef<HTMLInputElement>(null);

  return (
    <main className={pageClass}>
      <section className={panelClass}>
        <h1 className={titleClass}>Slide Over Fixture</h1>
        <p className={descriptionClass}>
          실제 브라우저에서 초기 포커스, 포커스 순환, backdrop 닫힘과 exit animation unmount를
          검증한다.
        </p>
        <button
          className={triggerButtonClass}
          onClick={() => {
            setIsOpen(true);
          }}
          type="button"
        >
          패널 열기
        </button>
      </section>
      <SlideOver
        ariaLabel="테스트 패널"
        initialFocusRef={initialFocusRef}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      >
        <div className={slideOverBodyClass}>
          <label className={fieldClass}>
            <span className={fieldLabelClass}>검색어</span>
            <input className={inputClass} ref={initialFocusRef} type="text" />
          </label>
          <div className={actionRowClass}>
            <button className={innerButtonClass} type="button">
              첫 번째 액션
            </button>
            <button className={innerButtonClass} type="button">
              마지막 액션
            </button>
          </div>
        </div>
      </SlideOver>
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

const triggerButtonClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '11',
  px: '5',
  borderRadius: 'full',
  backgroundColor: 'text',
  color: 'bg',
  fontWeight: 'medium',
});

const slideOverBodyClass = css({
  width: '[min(28rem, 100vw)]',
  height: 'full',
  display: 'grid',
  alignContent: 'start',
  gap: '4',
  px: '6',
  py: '8',
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

const actionRowClass = css({
  display: 'grid',
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
