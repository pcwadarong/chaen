'use client';

import React from 'react';
import { css } from 'styled-system/css';

import { Popover } from '@/shared/ui/popover/popover';

/**
 * Popover의 브라우저 포커스 및 outside interaction 계약을 검증하기 위한 fixture입니다.
 */
export const PopoverE2eFixture = () => {
  const [closeCount, setCloseCount] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <main className={pageClass}>
      <section className={panelClass}>
        <h1 className={titleClass}>Popover Fixture</h1>
        <p className={descriptionClass}>
          실제 브라우저에서 첫 포커스, Escape 닫힘, outside click 닫힘과 포커스 복원을 검증한다.
        </p>
        <output aria-live="polite" className={statusClass} data-testid="popover-close-count">
          closeCount:{closeCount}
        </output>
      </section>
      <div className={anchorRowClass}>
        <Popover
          isOpen={isOpen}
          label="테마"
          onOpenChange={nextOpen => {
            setIsOpen(previousOpen => {
              if (previousOpen && !nextOpen) {
                setCloseCount(previousCount => previousCount + 1);
              }

              return nextOpen;
            });
          }}
          panelLabel="테마 선택"
          value="시스템"
        >
          {() => (
            <div className={popoverBodyClass}>
              <button className={optionButtonClass} type="button">
                시스템
              </button>
              <button className={optionButtonClass} type="button">
                라이트
              </button>
            </div>
          )}
        </Popover>
      </div>
      <section className={outsidePanelClass}>
        <h2 className={outsideTitleClass}>Outside Area</h2>
        <p>팝오버 바깥 클릭 닫힘 계약을 검증하기 위한 안전한 영역이다.</p>
      </section>
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
    '[linear-gradient(180deg, color-mix(in srgb, #5d5bff 10%, white) 0%, color-mix(in srgb, #5d5bff 2%, white) 100%)]',
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

const statusClass = css({
  fontSize: 'sm',
  color: 'muted',
});

const anchorRowClass = css({
  display: 'flex',
  alignItems: 'start',
});

const popoverBodyClass = css({
  display: 'grid',
  gap: '2',
});

const optionButtonClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'start',
  minHeight: '10',
  px: '3',
  borderRadius: 'xl',
  background: 'bg',
});

const outsidePanelClass = css({
  minHeight: '[20rem]',
  display: 'grid',
  alignContent: 'start',
  gap: '2',
  p: '5',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderColor: 'border',
  background: 'surface',
});

const outsideTitleClass = css({
  fontSize: 'xl',
  fontWeight: 'semibold',
});
