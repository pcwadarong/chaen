'use client';

import { css } from '@emotion/react';
import React, { useState } from 'react';

import type { GuestbookEntry, GuestbookThreadItem } from '@/entities/guestbook/model/types';
import { GuestbookReplyBubble } from '@/entities/guestbook/ui/guestbook-reply-bubble';
import { GuestbookThreadBubble } from '@/entities/guestbook/ui/guestbook-thread-bubble';

type GuestbookThreadCardProps = {
  actionDeleteLabel: string;
  actionEditLabel: string;
  actionMenuLabel: string;
  actionMenuPanelLabel: string;
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
  reportLabel: string;
  revealSecretErrorLabel: string;
  revealSecretPasswordLabel: string;
  revealSecretRequiredLabel: string;
  revealSecretSubmitLabel: string;
  revealSecretTitle: string;
  revealLabel: string;
  secretPlaceholder: string;
};

/**
 * 방명록 스레드의 상태와 reply 목록을 조합하는 컨테이너입니다.
 * 메인 흰 버블과 관리자 답글 버블은 각각 별도 프레젠테이션 컴포넌트로 분리합니다.
 */
export const GuestbookThreadCard = ({
  actionDeleteLabel,
  actionEditLabel,
  actionMenuLabel,
  actionMenuPanelLabel,
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
  reportLabel,
  revealSecretErrorLabel,
  revealSecretPasswordLabel,
  revealSecretRequiredLabel,
  revealSecretSubmitLabel,
  revealSecretTitle,
  revealLabel,
  secretPlaceholder,
}: GuestbookThreadCardProps) => {
  const [isSecretPanelOpen, setIsSecretPanelOpen] = useState(false);
  const [isSecretSubmitting, setIsSecretSubmitting] = useState(false);
  const [secretError, setSecretError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const isSecretRevealed = !entry.is_secret || !entry.is_content_masked;

  return (
    <article css={threadStyle}>
      <GuestbookThreadBubble
        actionDeleteLabel={actionDeleteLabel}
        actionEditLabel={actionEditLabel}
        actionMenuLabel={actionMenuLabel}
        actionMenuPanelLabel={actionMenuPanelLabel}
        actionReplyLabel={actionReplyLabel}
        canReply={canReply}
        dateText={dateText}
        deletedPlaceholder={deletedPlaceholder}
        entry={entry}
        isSecretPanelOpen={isSecretPanelOpen}
        isSecretRevealed={isSecretRevealed}
        isSecretSubmitting={isSecretSubmitting}
        onDelete={onDelete}
        onEdit={onEdit}
        onReply={onReply}
        onRevealSecret={async (currentEntry, currentPasswordInput) => {
          if (!currentPasswordInput.trim()) {
            setSecretError(revealSecretRequiredLabel);
            return;
          }
          try {
            setSecretError(null);
            setIsSecretSubmitting(true);
            await onRevealSecret(currentEntry, currentPasswordInput);
            setPasswordInput('');
            setIsSecretPanelOpen(false);
          } catch {
            setSecretError(revealSecretErrorLabel);
          } finally {
            setIsSecretSubmitting(false);
          }
        }}
        onToggleSecretPanel={() => setIsSecretPanelOpen(previous => !previous)}
        passwordInput={passwordInput}
        revealLabel={revealLabel}
        revealSecretPasswordLabel={revealSecretPasswordLabel}
        revealSecretSubmitLabel={revealSecretSubmitLabel}
        revealSecretTitle={revealSecretTitle}
        reportLabel={reportLabel}
        secretError={secretError}
        secretPlaceholder={secretPlaceholder}
        setPasswordInput={setPasswordInput}
      />

      {entry.replies.length > 0 ? (
        <div css={replyStackStyle}>
          {entry.replies.map(reply => (
            <GuestbookReplyBubble
              actionDeleteLabel={actionDeleteLabel}
              actionMenuLabel={actionMenuLabel}
              actionMenuPanelLabel={actionMenuPanelLabel}
              deletedPlaceholder={deletedPlaceholder}
              actionEditLabel={actionEditLabel}
              dateText={dateText(reply.created_at)}
              entry={reply}
              key={reply.id}
              onDelete={replyEntry => onDeleteReply(replyEntry, entry)}
              onEdit={replyEntry => onEditReply(replyEntry, entry)}
              reportLabel={reportLabel}
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
  gap: var(--space-2);
`;

const replyStackStyle = css`
  display: grid;
  gap: var(--space-2);
`;
