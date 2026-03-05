'use client';

import { type CSSProperties, useState } from 'react';

import type { GuestbookThreadItem } from '@/entities/guestbook/model/types';
import { GuestbookAdminReplyBubble } from '@/entities/guestbook/ui/guestbook-admin-reply-bubble';

type GuestbookThreadCardProps = {
  dateText: (isoDate: string) => string;
  entry: GuestbookThreadItem;
  onReply: (entry: GuestbookThreadItem) => void;
  revealLabel: string;
  secretLabel: string;
  secretPlaceholder: string;
};

/**
 * 방명록 원댓글 카드와 하위 대댓글 목록을 렌더링합니다.
 * 비밀글은 기본적으로 내용을 숨기고 확인하기 버튼으로 열 수 있습니다.
 */
export const GuestbookThreadCard = ({
  dateText,
  entry,
  onReply,
  revealLabel,
  secretLabel,
  secretPlaceholder,
}: GuestbookThreadCardProps) => {
  const [isSecretPanelOpen, setIsSecretPanelOpen] = useState(false);
  const [isSecretRevealed, setIsSecretRevealed] = useState(!entry.is_secret);
  const [passwordInput, setPasswordInput] = useState('');

  return (
    <article style={threadStyle}>
      <div style={parentWrapStyle}>
        <div style={cardStyle}>
          <header style={headerStyle}>
            <div style={metaLeftStyle}>
              <strong style={nameStyle}>{entry.author_name}</strong>
              {entry.is_secret ? <span style={secretBadgeStyle}>{secretLabel}</span> : null}
            </div>
            <time dateTime={entry.created_at} style={dateStyle}>
              {dateText(entry.created_at)}
            </time>
          </header>

          <div style={bodyStyle}>
            {isSecretRevealed ? (
              <p style={contentStyle}>{entry.content}</p>
            ) : (
              <div style={secretContentStyle}>
                <p style={secretTextStyle}>{secretPlaceholder}</p>
                <button
                  onClick={() => setIsSecretPanelOpen(previous => !previous)}
                  style={secretButtonStyle}
                  type="button"
                >
                  {revealLabel}
                </button>
              </div>
            )}
          </div>

          {entry.is_secret && isSecretPanelOpen && !isSecretRevealed ? (
            <div style={revealPanelStyle}>
              <input
                onChange={event => setPasswordInput(event.target.value)}
                placeholder="비밀번호"
                style={revealInputStyle}
                type="password"
                value={passwordInput}
              />
              <button
                onClick={() => {
                  if (!passwordInput.trim()) return;
                  setIsSecretRevealed(true);
                  setIsSecretPanelOpen(false);
                }}
                style={revealConfirmButtonStyle}
                type="button"
              >
                확인
              </button>
            </div>
          ) : null}

          <footer style={footerStyle}>
            <button onClick={() => onReply(entry)} style={actionButtonStyle} type="button">
              답신하기
            </button>
            <button disabled style={actionButtonStyle} type="button">
              수정
            </button>
            <button disabled style={actionButtonStyle} type="button">
              삭제
            </button>
          </footer>
        </div>
      </div>

      {entry.replies.length > 0 ? (
        <div style={replyStackStyle}>
          {entry.replies.map(reply => (
            <GuestbookAdminReplyBubble
              dateText={dateText(reply.created_at)}
              entry={reply}
              key={reply.id}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
};

const threadStyle: CSSProperties = {
  width: '100%',
  display: 'grid',
  gap: '0.6rem',
};

const parentWrapStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-start',
};

const cardStyle: CSSProperties = {
  width: 'fit-content',
  maxWidth: 'min(760px, 92%)',
  display: 'grid',
  gap: '0.9rem',
  padding: '1rem',
  borderRadius: '1rem',
  border: '1px solid rgb(var(--color-border) / 0.25)',
  backgroundColor: 'rgb(var(--color-surface) / 0.82)',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '0.75rem',
};

const metaLeftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const nameStyle: CSSProperties = {
  fontSize: '1.08rem',
};

const secretBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '1.7rem',
  borderRadius: '999px',
  padding: '0 0.6rem',
  backgroundColor: 'rgb(var(--color-text) / 0.08)',
  color: 'rgb(var(--color-muted))',
  fontSize: '0.82rem',
  fontWeight: 600,
};

const dateStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
  fontSize: '0.86rem',
};

const bodyStyle: CSSProperties = {
  display: 'grid',
  gap: '0.5rem',
};

const contentStyle: CSSProperties = {
  whiteSpace: 'pre-wrap',
  lineHeight: 1.6,
};

const secretContentStyle: CSSProperties = {
  display: 'grid',
  gap: '0.65rem',
};

const secretTextStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
};

const secretButtonStyle: CSSProperties = {
  justifySelf: 'start',
  border: '1px solid rgb(var(--color-border) / 0.3)',
  backgroundColor: 'transparent',
  borderRadius: 'var(--radius-pill)',
  padding: '0.35rem 0.9rem',
  color: 'rgb(var(--color-text))',
};

const revealPanelStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: '0.5rem',
  padding: '0.75rem',
  borderRadius: '0.85rem',
  backgroundColor: 'rgb(var(--color-surface-muted) / 0.75)',
  animation: 'guestbook-secret-reveal 180ms ease',
};

const revealInputStyle: CSSProperties = {
  minHeight: '2.4rem',
  borderRadius: '0.6rem',
  border: '1px solid rgb(var(--color-border) / 0.3)',
  padding: '0 0.8rem',
  backgroundColor: 'rgb(var(--color-surface))',
  color: 'rgb(var(--color-text))',
};

const revealConfirmButtonStyle: CSSProperties = {
  minHeight: '2.4rem',
  borderRadius: '0.6rem',
  border: '1px solid rgb(var(--color-border) / 0.35)',
  padding: '0 0.9rem',
  backgroundColor: 'rgb(var(--color-surface-strong) / 0.45)',
  color: 'rgb(var(--color-text))',
  fontWeight: 600,
};

const footerStyle: CSSProperties = {
  display: 'flex',
  gap: '0.35rem',
  flexWrap: 'wrap',
};

const actionButtonStyle: CSSProperties = {
  border: 'none',
  backgroundColor: 'transparent',
  color: 'rgb(var(--color-muted))',
  padding: '0.25rem 0.4rem',
  fontSize: '0.9rem',
};

const replyStackStyle: CSSProperties = {
  display: 'grid',
  gap: '0.6rem',
};
