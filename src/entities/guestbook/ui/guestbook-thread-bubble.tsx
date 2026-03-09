'use client';

import React from 'react';
import { css } from 'styled-system/css';

import { useGuestbookBubbleActionMenu } from '@/entities/guestbook/lib/use-guestbook-bubble-action-menu';
import type { GuestbookThreadItem } from '@/entities/guestbook/model/types';
import { GuestbookEntryActionMenu } from '@/entities/guestbook/ui/guestbook-entry-action-menu';
import { GuestbookEntryBubble } from '@/entities/guestbook/ui/guestbook-entry-bubble';
import { Button } from '@/shared/ui/button/button';
import { Input } from '@/shared/ui/input/input';

type GuestbookThreadBubbleProps = {
  actionDeleteLabel: string;
  actionEditLabel: string;
  actionMenuLabel: string;
  actionMenuPanelLabel: string;
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
  reportLabel: string;
  secretError: string | null;
  secretPlaceholder: string;
  setPasswordInput: (value: string) => void;
};

/**
 * 일반 원댓글에 사용하는 밝은 톤의 메인 버블입니다.
 */
export const GuestbookThreadBubble = ({
  actionDeleteLabel,
  actionEditLabel,
  actionMenuLabel,
  actionMenuPanelLabel,
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
  reportLabel,
  secretError,
  secretPlaceholder,
  setPasswordInput,
}: GuestbookThreadBubbleProps) => {
  const isDeleted = Boolean(entry.deleted_at);
  const { isOpen, longPressHandlers, setIsOpen } = useGuestbookBubbleActionMenu({
    enabled: !isDeleted,
  });
  const isRevealInlineFormVisible =
    entry.is_secret && !isDeleted && isSecretPanelOpen && !isSecretRevealed;
  const canManageEntry = !entry.is_admin_author || canReply;

  return (
    <article className={threadShellClass} {...longPressHandlers}>
      <GuestbookEntryBubble
        action={
          !isDeleted ? (
            <GuestbookEntryActionMenu
              actionDeleteLabel={actionDeleteLabel}
              actionEditLabel={actionEditLabel}
              actionMenuLabel={actionMenuLabel}
              actionMenuPanelLabel={actionMenuPanelLabel}
              actionReplyLabel={canReply ? actionReplyLabel : undefined}
              isOpen={isOpen}
              onDelete={canManageEntry ? () => onDelete(entry) : undefined}
              onEdit={canManageEntry ? () => onEdit(entry) : undefined}
              onOpenChange={setIsOpen}
              onReply={canReply ? () => onReply(entry) : undefined}
              reportLabel={reportLabel}
            />
          ) : null
        }
        actionSide="end"
        actionVerticalAlign="end"
        meta={{
          authorName: entry.author_name,
          authorUrl: entry.author_blog_url,
          dateText: dateText(entry.created_at),
          dateTime: entry.created_at,
          position: 'top',
        }}
        variant="thread"
      >
        {isDeleted ? (
          <p className={deletedContentClass}>{deletedPlaceholder}</p>
        ) : isSecretRevealed ? (
          <p className={contentClass}>{entry.content}</p>
        ) : (
          <div className={secretContentClass}>
            {!isRevealInlineFormVisible ? (
              <>
                <p className={secretTextClass}>{secretPlaceholder}</p>
                <Button
                  className={revealButtonClass}
                  onClick={onToggleSecretPanel}
                  tone="white"
                  type="button"
                  variant="ghost"
                >
                  {revealLabel}
                </Button>
              </>
            ) : (
              <form
                aria-label={revealSecretTitle}
                onSubmit={event => {
                  event.preventDefault();
                  void onRevealSecret(entry, passwordInput);
                }}
                className={inlineRevealFormClass}
              >
                <Input
                  aria-label={revealSecretPasswordLabel}
                  className={inlineRevealInputClass}
                  onChange={event => setPasswordInput(event.target.value)}
                  placeholder={revealSecretPasswordLabel}
                  type="password"
                  value={passwordInput}
                />
                <Button
                  className={inlineRevealSubmitClass}
                  disabled={isSecretSubmitting}
                  tone="black"
                  type="submit"
                >
                  {revealSecretSubmitLabel}
                </Button>
              </form>
            )}
          </div>
        )}
        {secretError && isRevealInlineFormVisible ? (
          <p className={revealErrorClass} role="alert">
            {secretError}
          </p>
        ) : null}
      </GuestbookEntryBubble>
    </article>
  );
};

const threadShellClass = css({
  width: 'full',
});

const contentClass = css({
  whiteSpace: 'pre-wrap',
  lineHeight: '160',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
});

const deletedContentClass = css({
  color: 'muted',
  fontStyle: 'italic',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
});

const secretContentClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '2',
  flexWrap: 'wrap',
});

const inlineRevealFormClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  flexWrap: 'nowrap',
});

const secretTextClass = css({
  color: 'muted',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
});

const revealErrorClass = css({
  color: 'danger',
  fontSize: '14',
});

const revealButtonClass = css({
  minHeight: '8',
  px: '3',
  py: '1',
  borderRadius: 'pill',
});

const inlineRevealInputClass = css({
  minHeight: '8',
  minWidth: '40',
  borderRadius: 'pill',
  px: '2',
  py: '1',
});

const inlineRevealSubmitClass = css({
  minHeight: '8',
  px: '3',
  py: '1',
  whiteSpace: 'nowrap',
});
