'use client';

import { useLocale } from 'next-intl';
import React, { useActionState, useEffect, useRef, useState } from 'react';
import { css } from 'styled-system/css';

import type { GuestbookEntry, GuestbookThreadItem } from '@/entities/guestbook/model/types';
import { GuestbookReplyBubble } from '@/entities/guestbook/ui/guestbook-reply-bubble';
import { GuestbookThreadBubble } from '@/entities/guestbook/ui/guestbook-thread-bubble';
import { initialVerifyGuestbookSecretState } from '@/features/guestbook-feed/api/guestbook-action-state';
import { verifyGuestbookSecretAction } from '@/features/guestbook-feed/api/guestbook-actions';

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
  onRevealSecretSuccess: (entry: GuestbookEntry) => void;
  onReply: (entry: GuestbookThreadItem) => void;
  reportLabel: string;
  revealSecretPasswordLabel: string;
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
  onRevealSecretSuccess,
  onReply,
  reportLabel,
  revealSecretPasswordLabel,
  revealSecretSubmitLabel,
  revealSecretTitle,
  revealLabel,
  secretPlaceholder,
}: GuestbookThreadCardProps) => {
  const locale = useLocale();
  const [isSecretPanelOpen, setIsSecretPanelOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const isSecretRevealed = !entry.is_secret || !entry.is_content_masked;
  const [verifyState, verifyAction, isSecretSubmitting] = useActionState(
    verifyGuestbookSecretAction,
    initialVerifyGuestbookSecretState,
  );
  const lastHandledVerifyStateRef = useRef(verifyState);

  useEffect(() => {
    if (!verifyState.ok || !verifyState.data) return;
    if (lastHandledVerifyStateRef.current === verifyState) return;
    lastHandledVerifyStateRef.current = verifyState;

    onRevealSecretSuccess(verifyState.data.entry);
    setPasswordInput('');
    setIsSecretPanelOpen(false);
  }, [onRevealSecretSuccess, verifyState]);

  return (
    <article className={threadClass}>
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
        locale={locale}
        onDelete={onDelete}
        onEdit={onEdit}
        onReply={onReply}
        onRevealSecret={verifyAction}
        onToggleSecretPanel={() => setIsSecretPanelOpen(previous => !previous)}
        passwordInput={passwordInput}
        revealLabel={revealLabel}
        revealSecretPasswordLabel={revealSecretPasswordLabel}
        revealSecretSubmitLabel={revealSecretSubmitLabel}
        revealSecretTitle={revealSecretTitle}
        reportLabel={reportLabel}
        secretError={verifyState.errorMessage}
        secretPlaceholder={secretPlaceholder}
        setPasswordInput={setPasswordInput}
      />

      {entry.replies.length > 0 ? (
        <div className={replyStackClass}>
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

const threadClass = css({
  width: 'full',
  display: 'grid',
  gap: '2',
});

const replyStackClass = css({
  display: 'grid',
  gap: '2',
});
