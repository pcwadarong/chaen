'use client';

import React from 'react';
import { css } from 'styled-system/css';

import { ActionMenuButton, ActionPopover } from '@/shared/ui/action-popover/action-popover';

/**
 * ActionPopover의 브라우저 포커스와 outside interaction 계약을 검증하기 위한 fixture입니다.
 */
export const ActionPopoverE2eFixture = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <main className={pageClass}>
      <section className={panelClass}>
        <h1 className={titleClass}>Action Popover Fixture</h1>
        <p className={descriptionClass}>
          실제 브라우저에서 trigger-dialog 연결, Escape 닫힘과 outside click 닫힘을 검증한다.
        </p>
        <ActionPopover
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          panelLabel="액션 메뉴"
          triggerLabel="메뉴 열기"
        >
          {({ closePopover }) => (
            <>
              <ActionMenuButton label="수정" onClick={closePopover} />
              <ActionMenuButton ariaDisabled label="신고" />
            </>
          )}
        </ActionPopover>
      </section>
      <section className={outsidePanelClass}>
        <h2 className={outsideTitleClass}>Outside Area</h2>
        <p>액션 팝오버 바깥 클릭 닫힘 계약을 검증하기 위한 영역이다.</p>
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
  justifyItems: 'start',
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
