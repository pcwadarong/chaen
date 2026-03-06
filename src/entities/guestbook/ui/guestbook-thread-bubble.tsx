'use client';

import { css, keyframes } from '@emotion/react';
import React from 'react';

import type { GuestbookThreadItem } from '@/entities/guestbook/model/types';
import { GuestbookEntryBubble } from '@/entities/guestbook/ui/guestbook-entry-bubble';
import { Button } from '@/shared/ui/button/button';
import { Input } from '@/shared/ui/input/input';

type GuestbookThreadBubbleProps = {
  actionDeleteLabel: string;
  actionEditLabel: string;
  actionReplyLabel: string;
  canReply: boolean;
  dateText: (isoDate: string) => string;
  deletedPlaceholder: string;
  entry: GuestbookThreadItem;
  isSecretPanelOpen: boolean;
  isSecretRevealed: boolean;
  isSecretSubmitting: boolean;
  onDelete: (entry: GuestbookThreadItem) => void;
  onEdit: (entry: GuestbookThreadItem) => void;
  onReply: (entry: GuestbookThreadItem) => void;
  onRevealSecret: (entry: GuestbookThreadItem, password: string) => Promise<void>;
  onToggleSecretPanel: () => void;
  passwordInput: string;
  revealLabel: string;
  revealSecretPasswordLabel: string;
  revealSecretSubmitLabel: string;
  revealSecretTitle: string;
  secretError: string | null;
  secretLabel: string;
  secretPlaceholder: string;
  setPasswordInput: (value: string) => void;
};

/**
 * 일반 원댓글에 사용하는 밝은 톤의 메인 버블입니다.
 */
export const GuestbookThreadBubble = ({
  actionDeleteLabel,
  actionEditLabel,
  actionReplyLabel,
  canReply,
  dateText,
  deletedPlaceholder,
  entry,
  isSecretPanelOpen,
  isSecretRevealed,
  isSecretSubmitting,
  onDelete,
  onEdit,
  onReply,
  onRevealSecret,
  onToggleSecretPanel,
  passwordInput,
  revealLabel,
  revealSecretPasswordLabel,
  revealSecretSubmitLabel,
  revealSecretTitle,
  secretError,
  secretLabel,
  secretPlaceholder,
  setPasswordInput,
}: GuestbookThreadBubbleProps) => {
  const isDeleted = Boolean(entry.deleted_at);

  return (
    <GuestbookEntryBubble
      footer={
        <>
          {canReply && !isDeleted ? (
            <Button onClick={() => onReply(entry)} tone="black" variant="underline">
              {actionReplyLabel}
            </Button>
          ) : null}
          {!isDeleted ? (
            <>
              <Button onClick={() => onEdit(entry)} tone="black" variant="underline">
                {actionEditLabel}
              </Button>
              <Button onClick={() => onDelete(entry)} tone="black" variant="underline">
                {actionDeleteLabel}
              </Button>
            </>
          ) : null}
        </>
      }
      header={
        <>
          <div css={metaLeftStyle}>
            <strong css={nameStyle}>{entry.author_name}</strong>
            {entry.is_secret ? <span css={secretBadgeStyle}>{secretLabel}</span> : null}
          </div>
          <time dateTime={entry.created_at} css={dateStyle}>
            {dateText(entry.created_at)}
          </time>
        </>
      }
      maxWidth="min(760px, 92%)"
    >
      <div css={bodyStyle}>
        {isDeleted ? (
          <p css={deletedContentStyle}>{deletedPlaceholder}</p>
        ) : isSecretRevealed ? (
          <p css={contentStyle}>{entry.content}</p>
        ) : (
          <div css={secretContentStyle}>
            <p css={secretTextStyle}>{secretPlaceholder}</p>
            <Button onClick={onToggleSecretPanel} tone="white" type="button" variant="ghost">
              {revealLabel}
            </Button>
          </div>
        )}
      </div>

      {entry.is_secret && !isDeleted && isSecretPanelOpen && !isSecretRevealed ? (
        <div css={revealPanelStyle}>
          <p css={revealTitleStyle}>{revealSecretTitle}</p>
          <Input
            onChange={event => setPasswordInput(event.target.value)}
            placeholder={revealSecretPasswordLabel}
            type="password"
            value={passwordInput}
          />
          <Button
            disabled={isSecretSubmitting}
            onClick={() => void onRevealSecret(entry, passwordInput)}
            tone="black"
            type="button"
          >
            {revealSecretSubmitLabel}
          </Button>
          {secretError ? <p css={revealErrorStyle}>{secretError}</p> : null}
        </div>
      ) : null}
    </GuestbookEntryBubble>
  );
};

const secretRevealAnimation = keyframes`
  from {
    opacity: 0;
    filter: blur(6px);
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }
`;

const metaLeftStyle = css`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
`;

const nameStyle = css`
  font-size: var(--font-size-18);
`;

const secretBadgeStyle = css`
  display: inline-flex;
  align-items: center;
  min-height: 1.7rem;
  border-radius: var(--radius-pill);
  padding: var(--space-0) var(--space-2);
  background-color: rgb(var(--color-text) / 0.08);
  color: rgb(var(--color-muted));
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-semibold);
`;

const dateStyle = css`
  color: rgb(var(--color-muted));
  font-size: var(--font-size-14);
`;

const bodyStyle = css`
  display: grid;
  gap: var(--space-2);
`;

const contentStyle = css`
  white-space: pre-wrap;
  line-height: var(--line-height-160);
`;

const deletedContentStyle = css`
  color: rgb(var(--color-muted));
  font-style: italic;
`;

const secretContentStyle = css`
  display: grid;
  gap: var(--space-3);
`;

const secretTextStyle = css`
  color: rgb(var(--color-muted));
`;

const revealPanelStyle = css`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-m);
  background-color: rgb(var(--color-surface-muted) / 0.75);
  animation: ${secretRevealAnimation} 180ms ease;
`;

const revealTitleStyle = css`
  grid-column: 1 / -1;
  color: rgb(var(--color-muted));
  font-size: var(--font-size-14);
`;

const revealErrorStyle = css`
  grid-column: 1 / -1;
  color: rgb(var(--color-danger));
  font-size: var(--font-size-14);
`;
