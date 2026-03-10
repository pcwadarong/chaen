'use client';

import React from 'react';
import { css, cva } from 'styled-system/css';

export type ToastItem = {
  id: string;
  message: string;
  tone: 'error' | 'info' | 'success';
};

type ToastViewportProps = {
  closeLabel: string;
  items: ToastItem[];
  onClose: (id: string) => void;
};

/**
 * 전역 상태 없이 페이지 단위에서 사용할 수 있는 간단한 토스트 뷰포트입니다.
 */
export const ToastViewport = ({ closeLabel, items, onClose }: ToastViewportProps) => (
  <div aria-live="polite" className={viewportClass}>
    {items.map(item => (
      <div className={toastRecipe({ tone: item.tone })} key={item.id}>
        <p className={messageClass}>{item.message}</p>
        <button className={closeButtonClass} onClick={() => onClose(item.id)} type="button">
          {closeLabel}
        </button>
      </div>
    ))}
  </div>
);

const viewportClass = css({
  position: 'fixed',
  right: '4',
  bottom: '4',
  zIndex: '70',
  display: 'grid',
  gap: '2',
  width: '[min(22rem,calc(100vw-2rem))]',
});

const toastRecipe = cva({
  base: {
    borderRadius: 'sm',
    border: '[1px solid var(--colors-border)]',
    backgroundColor: 'surface',
    display: 'grid',
    gridTemplateColumns: '[1fr auto]',
    alignItems: 'start',
    gap: '3',
    px: '3',
    py: '3',
    boxShadow: '[0 10px 24px rgb(15 23 42 / 0.12)]',
  },
  variants: {
    tone: {
      error: {
        borderLeft: '[3px solid var(--colors-danger)]',
      },
      info: {
        borderLeft: '[3px solid var(--colors-muted)]',
      },
      success: {
        borderLeft: '[3px solid var(--colors-success)]',
      },
    },
  },
});

const messageClass = css({
  m: '0',
  fontSize: 'sm',
  lineHeight: 'normal',
});

const closeButtonClass = css({
  border: 'none',
  background: 'transparent',
  color: 'muted',
  fontSize: 'xs',
  textDecoration: 'underline',
  p: '0',
});
