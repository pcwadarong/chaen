'use client';

import { css } from '@emotion/react';
import React from 'react';
import { css as pandaCss } from 'styled-system/css';

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
    <article css={threadShellStyle} {...longPressHandlers}>
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
          <p css={deletedContentStyle}>{deletedPlaceholder}</p>
        ) : isSecretRevealed ? (
          <p css={contentStyle}>{entry.content}</p>
        ) : (
          <div css={secretContentStyle}>
            {!isRevealInlineFormVisible ? (
              <>
                <p css={secretTextStyle}>{secretPlaceholder}</p>
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
                css={inlineRevealFormStyle}
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
          <p role="alert" css={revealErrorStyle}>
            {secretError}
          </p>
        ) : null}
      </GuestbookEntryBubble>
    </article>
  );
};

const threadShellStyle = css`
  width: 100%;
`;

const contentStyle = css`
  white-space: pre-wrap;
  line-height: var(--line-height-160);
  word-break: break-word;
  overflow-wrap: anywhere;
`;

const deletedContentStyle = css`
  color: rgb(var(--color-muted));
  font-style: italic;
  word-break: break-word;
  overflow-wrap: anywhere;
`;

const secretContentStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  flex-wrap: wrap;
`;

const inlineRevealFormStyle = css`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: nowrap;
`;

const secretTextStyle = css`
  color: rgb(var(--color-muted));
  word-break: break-word;
  overflow-wrap: anywhere;
`;

const revealErrorStyle = css`
  color: rgb(var(--color-danger));
  font-size: var(--font-size-14);
`;

const revealButtonClass = pandaCss({
  minHeight: '8',
  px: '3',
  py: '1',
  borderRadius: 'pill',
});

const inlineRevealInputClass = pandaCss({
  minHeight: '8',
  minWidth: '40',
  borderRadius: 'pill',
  px: '2',
  py: '1',
});

const inlineRevealSubmitClass = pandaCss({
  minHeight: '8',
  px: '3',
  py: '1',
  whiteSpace: 'nowrap',
});
