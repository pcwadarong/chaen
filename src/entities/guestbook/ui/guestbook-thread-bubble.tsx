'use client';

import { css } from '@emotion/react';
import Image from 'next/image';
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
  secretPlaceholder,
  setPasswordInput,
}: GuestbookThreadBubbleProps) => {
  const isDeleted = Boolean(entry.deleted_at);
  const isRevealInlineFormVisible =
    entry.is_secret && !isDeleted && isSecretPanelOpen && !isSecretRevealed;

  return (
    <article css={threadShellStyle}>
      <GuestbookEntryBubble
        maxWidth="min(760px, 92%)"
        top={
          <div css={metaRowStyle}>
            <div css={metaLeftStyle}>
              <strong css={nameStyle}>{entry.author_name}</strong>
              <time dateTime={entry.created_at} css={dateStyle}>
                {dateText(entry.created_at)}
              </time>
            </div>
          </div>
        }
        bottom={
          !isDeleted ? (
            <div css={actionRowStyle}>
              {canReply ? (
                <Button
                  onClick={() => onReply(entry)}
                  css={actionButtonStyle}
                  leadingVisual={
                    <Image
                      alt=""
                      aria-hidden
                      height={16}
                      src="/arrow-curve-left-right.svg"
                      width={16}
                    />
                  }
                  tone="black"
                  type="button"
                  variant="underline"
                >
                  {actionReplyLabel}
                </Button>
              ) : null}
              <Button
                onClick={() => onEdit(entry)}
                css={actionButtonStyle}
                leadingVisual={<Image alt="" aria-hidden height={16} src="/edit.svg" width={16} />}
                tone="black"
                type="button"
                variant="underline"
              >
                {actionEditLabel}
              </Button>
              <Button
                onClick={() => onDelete(entry)}
                css={actionButtonStyle}
                leadingVisual={<Image alt="" aria-hidden height={16} src="/trash.svg" width={16} />}
                tone="black"
                type="button"
                variant="underline"
              >
                {actionDeleteLabel}
              </Button>
            </div>
          ) : null
        }
      >
        <div css={bodyStyle}>
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
                    onClick={onToggleSecretPanel}
                    css={revealButtonStyle}
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
                    onChange={event => setPasswordInput(event.target.value)}
                    placeholder={revealSecretPasswordLabel}
                    type="password"
                    value={passwordInput}
                    css={inlineRevealInputStyle}
                  />
                  <Button
                    disabled={isSecretSubmitting}
                    tone="black"
                    type="submit"
                    css={inlineRevealSubmitStyle}
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
        </div>
      </GuestbookEntryBubble>
    </article>
  );
};

const threadShellStyle = css`
  width: 100%;
`;

const metaLeftStyle = css`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
`;

const nameStyle = css`
  font-size: var(--font-size-18);
  font-weight: var(--font-weight-semibold);
`;

const dateStyle = css`
  color: rgb(var(--color-muted));
  font-size: var(--font-size-14);
`;

const metaRowStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  flex-wrap: wrap;
`;

const revealButtonStyle = css`
  min-height: 2rem;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
`;

const inlineRevealFormStyle = css`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: nowrap;
`;

const secretTextStyle = css`
  color: rgb(var(--color-muted));
`;

const inlineRevealInputStyle = css`
  min-height: 2rem;
  min-width: 10rem;
  border-radius: var(--radius-pill);
  border-color: rgb(var(--color-border) / 0.24);
  padding: var(--space-1) var(--space-2);

  &:hover:not(:disabled) {
    border-color: rgb(var(--color-border) / 0.36);
  }
`;

const inlineRevealSubmitStyle = css`
  min-height: 2rem;
  padding: var(--space-1) var(--space-3);
  white-space: nowrap;
`;

const revealErrorStyle = css`
  color: rgb(var(--color-danger));
  font-size: var(--font-size-14);
`;

const actionRowStyle = css`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
`;

const actionButtonStyle = css`
  padding: 0;
  min-height: auto;
  text-decoration: none;
  color: rgb(var(--color-muted));

  &:hover:not(:disabled):not([aria-disabled='true']) {
    color: rgb(var(--color-text));
    background: transparent;
    border-color: transparent;
  }

  & > span[aria-hidden='true'] img {
    width: 1rem;
    height: 1rem;
    object-fit: contain;
    opacity: 0.8;
    filter: grayscale(1);
  }

  [data-theme='dark'] & > span[aria-hidden='true'] img {
    filter: grayscale(1) invert(1);
  }
`;
