'use client';

import { css } from '@emotion/react';

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
  <div aria-live="polite" css={viewportStyle}>
    {items.map(item => (
      <div key={item.id} css={[toastStyle, toneStyleMap[item.tone]]}>
        <p css={messageStyle}>{item.message}</p>
        <button onClick={() => onClose(item.id)} css={closeButtonStyle} type="button">
          {closeLabel}
        </button>
      </div>
    ))}
  </div>
);

const viewportStyle = css`
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 70;
  display: grid;
  gap: 0.45rem;
  width: min(22rem, calc(100vw - 2rem));
`;

const toastStyle = css`
  border-radius: 0.8rem;
  border: 1px solid rgb(var(--color-border) / 0.3);
  background-color: rgb(var(--color-surface));
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 0.75rem;
  padding: 0.7rem 0.8rem;
  box-shadow: 0 10px 24px rgb(0 0 0 / 0.12);
`;

const toneStyleMap: Record<ToastItem['tone'], ReturnType<typeof css>> = {
  info: css`
    border-left: 3px solid rgb(var(--color-muted));
  `,
  success: css`
    border-left: 3px solid rgb(50 170 110);
  `,
  error: css`
    border-left: 3px solid rgb(var(--color-danger, 210 75 75));
  `,
};

const messageStyle = css`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.35;
`;

const closeButtonStyle = css`
  border: none;
  background: transparent;
  color: rgb(var(--color-muted));
  font-size: 0.8rem;
  text-decoration: underline;
  padding: 0;
`;
