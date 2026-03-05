'use client';

import { css } from '@emotion/react';
import React, { useState } from 'react';

import type { GuestbookEntry, GuestbookThreadItem } from '@/entities/guestbook/model/types';
import { GuestbookReplyBubble } from '@/entities/guestbook/ui/guestbook-reply-bubble';

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
    <article css={threadStyle}>
      <div css={parentWrapStyle}>
        <div css={cardStyle}>
          <header css={headerStyle}>
            <div css={metaLeftStyle}>
              <strong css={nameStyle}>{entry.author_name}</strong>
              {entry.is_secret ? <span css={secretBadgeStyle}>{secretLabel}</span> : null}
            </div>
            <time dateTime={entry.created_at} css={dateStyle}>
              {dateText(entry.created_at)}
            </time>
          </header>

          <div css={bodyStyle}>
            {isDeleted ? (
              <p css={deletedContentStyle}>{deletedPlaceholder}</p>
            ) : isSecretRevealed ? (
              <p css={contentStyle}>{entry.content}</p>
            ) : (
              <div css={secretContentStyle}>
                <p css={secretTextStyle}>{secretPlaceholder}</p>
                <button
                  onClick={() => setIsSecretPanelOpen(previous => !previous)}
                  css={secretButtonStyle}
                  type="button"
                >
                  {revealLabel}
                </button>
              </div>
            )}
          </div>

          {entry.is_secret && !isDeleted && isSecretPanelOpen && !isSecretRevealed ? (
            <div css={revealPanelStyle}>
              <p css={revealTitleStyle}>{revealSecretTitle}</p>
              <input
                onChange={event => setPasswordInput(event.target.value)}
                placeholder={revealSecretPasswordLabel}
                css={revealInputStyle}
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
                css={revealConfirmButtonStyle}
                type="button"
              >
                {revealSecretSubmitLabel}
              </button>
              {secretError ? <p css={revealErrorStyle}>{secretError}</p> : null}
            </div>
          ) : null}

          <footer css={footerStyle}>
            {canReply && !isDeleted ? (
              <button onClick={() => onReply(entry)} css={actionButtonStyle} type="button">
                {actionReplyLabel}
              </button>
            ) : null}
            {!isDeleted ? (
              <>
                <button onClick={() => onEdit(entry)} css={actionButtonStyle} type="button">
                  {actionEditLabel}
                </button>
                <button onClick={() => onDelete(entry)} css={actionButtonStyle} type="button">
                  {actionDeleteLabel}
                </button>
              </>
            ) : null}
          </footer>
        </div>
      </div>

      {entry.replies.length > 0 ? (
        <div css={replyStackStyle}>
          {entry.replies.map(reply => (
            <GuestbookReplyBubble
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

const threadStyle = css`
  width: 100%;
  display: grid;
  gap: 0.6rem;
`;

const parentWrapStyle = css`
  display: flex;
  justify-content: flex-start;
`;

const cardStyle = css`
  width: fit-content;
  max-width: min(760px, 92%);
  display: grid;
  gap: 0.9rem;
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid rgb(var(--color-border) / 0.25);
  background-color: rgb(var(--color-surface) / 0.82);
`;

const headerStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
`;

const metaLeftStyle = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const nameStyle = css`
  font-size: 1.08rem;
`;

const secretBadgeStyle = css`
  display: inline-flex;
  align-items: center;
  min-height: 1.7rem;
  border-radius: 999px;
  padding: 0 0.6rem;
  background-color: rgb(var(--color-text) / 0.08);
  color: rgb(var(--color-muted));
  font-size: 0.82rem;
  font-weight: 600;
`;

const dateStyle = css`
  color: rgb(var(--color-muted));
  font-size: 0.86rem;
`;

const bodyStyle = css`
  display: grid;
  gap: 0.5rem;
`;

const contentStyle = css`
  white-space: pre-wrap;
  line-height: 1.6;
`;

const deletedContentStyle = css`
  color: rgb(var(--color-muted));
  font-style: italic;
`;

const secretContentStyle = css`
  display: grid;
  gap: 0.65rem;
`;

const secretTextStyle = css`
  color: rgb(var(--color-muted));
`;

const secretButtonStyle = css`
  justify-self: start;
  border: 1px solid rgb(var(--color-border) / 0.3);
  background-color: transparent;
  border-radius: var(--radius-pill);
  padding: 0.35rem 0.9rem;
  color: rgb(var(--color-text));
`;

const revealPanelStyle = css`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.85rem;
  background-color: rgb(var(--color-surface-muted) / 0.75);
  animation: guestbook-secret-reveal 180ms ease;
`;

const revealTitleStyle = css`
  grid-column: 1 / -1;
  color: rgb(var(--color-muted));
  font-size: 0.88rem;
`;

const revealInputStyle = css`
  min-height: 2.4rem;
  border-radius: 0.6rem;
  border: 1px solid rgb(var(--color-border) / 0.3);
  padding: 0 0.8rem;
  background-color: rgb(var(--color-surface));
  color: rgb(var(--color-text));
`;

const revealConfirmButtonStyle = css`
  min-height: 2.4rem;
  border-radius: 0.6rem;
  border: 1px solid rgb(var(--color-border) / 0.35);
  padding: 0 0.9rem;
  background-color: rgb(var(--color-surface-strong) / 0.45);
  color: rgb(var(--color-text));
  font-weight: 600;
`;

const revealErrorStyle = css`
  grid-column: 1 / -1;
  color: rgb(var(--color-danger, 210 75 75));
  font-size: 0.88rem;
`;

const footerStyle = css`
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
`;

const actionButtonStyle = css`
  border: none;
  background-color: transparent;
  color: rgb(var(--color-muted));
  padding: 0.25rem 0.4rem;
  font-size: 0.9rem;
`;

const replyStackStyle = css`
  display: grid;
  gap: 0.6rem;
`;
