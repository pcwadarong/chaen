'use client';

import React from 'react';
import { css } from 'styled-system/css';

import { Tooltip } from '@/shared/ui/tooltip/tooltip';

/**
 * Tooltip의 브라우저 hover/focus 계약을 검증하기 위한 fixture입니다.
 */
export const TooltipE2eFixture = () => (
  <main className={pageClass}>
    <section className={panelClass}>
      <h1 className={titleClass}>Tooltip Fixture</h1>
      <p className={descriptionClass}>
        실제 브라우저에서 focus, blur, hover, openOnFocus 제어가 tooltip 상태와 aria-describedby에
        반영되는지 검증한다.
      </p>
      <div className={buttonRowClass}>
        <Tooltip content="굵게">
          <button className={triggerButtonClass} type="button">
            굵게 버튼
          </button>
        </Tooltip>
        <Tooltip content="정렬">
          <button className={triggerButtonClass} type="button">
            정렬 버튼
          </button>
        </Tooltip>
        <Tooltip content="이미지 축소" openOnFocus={false}>
          <button className={triggerButtonClass} type="button">
            축소 버튼
          </button>
        </Tooltip>
      </div>
      <button className={outsideButtonClass} type="button">
        바깥 포커스 이동
      </button>
    </section>
  </main>
);

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
  gap: '4',
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

const buttonRowClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4',
});

const triggerButtonClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '11',
  px: '5',
  borderRadius: 'full',
  borderWidth: '1px',
  borderColor: 'border',
  background: 'surface',
});

const outsideButtonClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '10',
  px: '4',
  borderRadius: 'full',
  backgroundColor: 'text',
  color: 'surface',
  width: '[fit-content]',
});
