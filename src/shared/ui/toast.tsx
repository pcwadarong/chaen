'use client';

import type { CSSProperties } from 'react';

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
  <div aria-live="polite" style={viewportStyle}>
    {items.map(item => (
      <div key={item.id} style={{ ...toastStyle, ...toneStyleMap[item.tone] }}>
        <p style={messageStyle}>{item.message}</p>
        <button onClick={() => onClose(item.id)} style={closeButtonStyle} type="button">
          {closeLabel}
        </button>
      </div>
    ))}
  </div>
);

const viewportStyle: CSSProperties = {
  position: 'fixed',
  right: '1rem',
  bottom: '1rem',
  zIndex: 70,
  display: 'grid',
  gap: '0.45rem',
  width: 'min(22rem, calc(100vw - 2rem))',
};

const toastStyle: CSSProperties = {
  borderRadius: '0.8rem',
  border: '1px solid rgb(var(--color-border) / 0.3)',
  backgroundColor: 'rgb(var(--color-surface))',
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'start',
  gap: '0.75rem',
  padding: '0.7rem 0.8rem',
  boxShadow: '0 10px 24px rgb(0 0 0 / 0.12)',
};

const toneStyleMap: Record<ToastItem['tone'], CSSProperties> = {
  info: {
    borderLeft: '3px solid rgb(var(--color-muted))',
  },
  success: {
    borderLeft: '3px solid rgb(50 170 110)',
  },
  error: {
    borderLeft: '3px solid rgb(var(--color-danger, 210 75 75))',
  },
};

const messageStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.9rem',
  lineHeight: 1.35,
};

const closeButtonStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'rgb(var(--color-muted))',
  fontSize: '0.8rem',
  textDecoration: 'underline',
  padding: 0,
};
