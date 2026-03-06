'use client';

import { css } from '@emotion/react';
import React from 'react';

import { Button } from '@/shared/ui/button/button';
import { LockIcon, LockOpenIcon, SendIcon } from '@/shared/ui/icons/app-icons';

type GuestbookComposeActionsProps = {
  isAdmin: boolean;
  isSecret: boolean;
  isSubmitting: boolean;
  onSecretChange: (checked: boolean) => void;
  secretCheckboxId: string;
  secretLabel: string;
  submitLabel: string;
};

/** 비밀글 토글과 전송 버튼 액션 영역을 렌더링합니다. */
export const GuestbookComposeActions = ({
  isAdmin,
  isSecret,
  isSubmitting,
  onSecretChange,
  secretCheckboxId,
  secretLabel,
  submitLabel,
}: GuestbookComposeActionsProps) => (
  <div css={rightActionsStyle}>
    {!isAdmin ? (
      <div css={secretControlGroupStyle}>
        <input
          id={secretCheckboxId}
          aria-label={secretLabel}
          checked={isSecret}
          css={secretCheckboxStyle}
          onChange={event => onSecretChange(event.target.checked)}
          type="checkbox"
        />
        <label
          aria-label={secretLabel}
          css={secretToggleLabelStyle}
          data-checked={isSecret ? 'true' : 'false'}
          htmlFor={secretCheckboxId}
        >
          <span aria-hidden css={secretIconStackStyle} data-checked={isSecret ? 'true' : 'false'}>
            <LockOpenIcon css={secretIconOpenStyle} size="lg" />
            <LockIcon css={secretIconClosedStyle} size="lg" />
          </span>
        </label>
      </div>
    ) : null}
    <Button
      disabled={isSubmitting}
      leadingVisual={<SendIcon aria-hidden size="md" />}
      tone="black"
      type="submit"
      css={submitButtonStyle}
    >
      {submitLabel}
    </Button>
  </div>
);

const secretControlGroupStyle = css`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
`;

const rightActionsStyle = css`
  display: inline-flex;
  gap: var(--space-2);
  flex: 0 0 auto;
  margin-left: auto;
  align-self: flex-end;
`;

const secretToggleLabelStyle = css`
  padding: var(--space-0);
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-pill);
  background: transparent;
  color: rgb(var(--color-muted));
  border: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  cursor: pointer;
  transition: color 180ms ease;

  &:hover,
  input:focus-visible + & {
    background: transparent;
    color: rgb(var(--color-text));
  }
`;

const secretIconStackStyle = css`
  position: relative;
  width: 1.125rem;
  height: 1.125rem;
  display: inline-block;
  transform: translateY(-1px);
`;

const secretIconOpenStyle = css`
  position: absolute;
  inset: 0;
  opacity: 0.8;
  transition: opacity 180ms ease;

  [data-checked='true'] & {
    opacity: 0;
  }

  label:hover & {
    opacity: 0;
  }
`;

const secretIconClosedStyle = css`
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 180ms ease;

  [data-checked='true'] & {
    opacity: 0.8;
  }

  label:hover & {
    opacity: 0.8;
  }
`;

const secretCheckboxStyle = css`
  width: 1rem;
  height: 1rem;
  margin: 0;
  display: block;
  accent-color: rgb(var(--color-primary));
`;

const submitButtonStyle = css`
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-semibold);
`;
