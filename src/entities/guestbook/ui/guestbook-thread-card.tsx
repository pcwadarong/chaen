'use client';

import React, { type CSSProperties, useState } from 'react';

import type { GuestbookEntry, GuestbookThreadItem } from '@/entities/guestbook/model/types';
import { GuestbookAdminReplyBubble } from '@/entities/guestbook/ui/guestbook-admin-reply-bubble';

type GuestbookThreadCardProps = {
  actionDeleteLabel: string;
  actionEditLabel: string;
  actionReplyLabel: string;
  canReply: boolean;
  dateText: (isoDate: string) => string;
  deletedPlaceholder: string;
  entry: GuestbookThreadItem;
  onDeleteReply: (entry: GuestbookEntry, parentEntry: GuestbookThreadItem) => void;
  onDelete: (entry: GuestbookThreadItem) => void;
  onEditReply: (entry: GuestbookEntry, parentEntry: GuestbookThreadItem) => void;
  onEdit: (entry: GuestbookThreadItem) => void;
  onRevealSecret: (entry: GuestbookThreadItem, password: string) => Promise<void>;
  onReply: (entry: GuestbookThreadItem) => void;
  revealSecretErrorLabel: string;
  revealSecretPasswordLabel: string;
  revealSecretSubmitLabel: string;
  revealSecretTitle: string;
  revealLabel: string;
  secretLabel: string;
  secretPlaceholder: string;
};

/**
 * 방명록 원댓글 카드와 하위 대댓글 목록을 렌더링합니다.
 * 비밀글은 기본적으로 내용을 숨기고 확인하기 버튼으로 열 수 있습니다.
 */
export const GuestbookThreadCard = ({
  actionDeleteLabel,
  actionEditLabel,
  actionReplyLabel,
  canReply,
  dateText,
  deletedPlaceholder,
  entry,
  onDeleteReply,
  onDelete,
  onEditReply,
  onEdit,
  onRevealSecret,
  onReply,
  revealSecretErrorLabel,
  revealSecretPasswordLabel,
  revealSecretSubmitLabel,
  revealSecretTitle,
  revealLabel,
  secretLabel,
  secretPlaceholder,
}: GuestbookThreadCardProps) => {
  const [isSecretPanelOpen, setIsSecretPanelOpen] = useState(false);
  const [isSecretSubmitting, setIsSecretSubmitting] = useState(false);
  const [secretError, setSecretError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const isSecretRevealed = !entry.is_secret || !entry.is_content_masked;
  const isDeleted = Boolean(entry.deleted_at);

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
            {isDeleted ? (
              <p style={deletedContentStyle}>{deletedPlaceholder}</p>
            ) : isSecretRevealed ? (
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

          {entry.is_secret && !isDeleted && isSecretPanelOpen && !isSecretRevealed ? (
            <div style={revealPanelStyle}>
              <p style={revealTitleStyle}>{revealSecretTitle}</p>
              <input
                onChange={event => setPasswordInput(event.target.value)}
                placeholder={revealSecretPasswordLabel}
                style={revealInputStyle}
                type="password"
                value={passwordInput}
              />
              <button
                disabled={isSecretSubmitting}
                onClick={async () => {
                  if (!passwordInput.trim()) return;
                  try {
                    setSecretError(null);
                    setIsSecretSubmitting(true);
                    await onRevealSecret(entry, passwordInput);
                    setPasswordInput('');
                    setIsSecretPanelOpen(false);
                  } catch {
                    setSecretError(revealSecretErrorLabel);
                  } finally {
                    setIsSecretSubmitting(false);
                  }
                }}
                style={revealConfirmButtonStyle}
                type="button"
              >
                {revealSecretSubmitLabel}
              </button>
              {secretError ? <p style={revealErrorStyle}>{secretError}</p> : null}
            </div>
          ) : null}

          <footer style={footerStyle}>
            {canReply && !isDeleted ? (
              <button onClick={() => onReply(entry)} style={actionButtonStyle} type="button">
                {actionReplyLabel}
              </button>
            ) : null}
            {!isDeleted ? (
              <>
                <button onClick={() => onEdit(entry)} style={actionButtonStyle} type="button">
                  {actionEditLabel}
                </button>
                <button onClick={() => onDelete(entry)} style={actionButtonStyle} type="button">
                  {actionDeleteLabel}
                </button>
              </>
            ) : null}
          </footer>
        </div>
      </div>

      {entry.replies.length > 0 ? (
        <div style={replyStackStyle}>
          {entry.replies.map(reply => (
            <GuestbookAdminReplyBubble
              actionDeleteLabel={actionDeleteLabel}
              deletedPlaceholder={deletedPlaceholder}
              actionEditLabel={actionEditLabel}
              dateText={dateText(reply.created_at)}
              entry={reply}
              key={reply.id}
              onDelete={replyEntry => onDeleteReply(replyEntry, entry)}
              onEdit={replyEntry => onEditReply(replyEntry, entry)}
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

const deletedContentStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
  fontStyle: 'italic',
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

const revealTitleStyle: CSSProperties = {
  gridColumn: '1 / -1',
  color: 'rgb(var(--color-muted))',
  fontSize: '0.88rem',
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

const revealErrorStyle: CSSProperties = {
  gridColumn: '1 / -1',
  color: 'rgb(var(--color-danger, 210 75 75))',
  fontSize: '0.88rem',
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
