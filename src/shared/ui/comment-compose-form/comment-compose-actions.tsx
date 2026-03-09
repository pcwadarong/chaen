'use client';

import { css } from '@emotion/react';
import React from 'react';
import { css as pandaCss } from 'styled-system/css';

import { Button } from '@/shared/ui/button/button';
import { LockIcon, LockOpenIcon, SendIcon } from '@/shared/ui/icons/app-icons';

type GuestbookComposeActionsProps = {
  allowSecretToggle: boolean;
  isSecret: boolean;
  isSubmitting: boolean;
  onSecretChange: (checked: boolean) => void;
  secretCheckboxId: string;
  secretLabel: string;
  submitLabel: string;
};

/** 비밀글 토글과 전송 버튼 액션 영역을 렌더링합니다. */
export const CommentComposeActions = ({
  allowSecretToggle,
  isSecret,
  isSubmitting,
  onSecretChange,
  secretCheckboxId,
  secretLabel,
  submitLabel,
}: GuestbookComposeActionsProps) => (
  <div css={rightActionsStyle}>
    {allowSecretToggle ? (
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
            <LockOpenIcon className={secretIconOpenClass} size="lg" />
            <LockIcon className={secretIconClosedClass} size="lg" />
          </span>
        </label>
      </div>
    ) : null}
    <Button
      className={submitButtonClass}
      disabled={isSubmitting}
      leadingVisual={<SendIcon aria-hidden size="md" />}
      tone="black"
      type="submit"
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

const secretIconOpenClass = pandaCss({
  position: 'absolute',
  inset: '0',
  opacity: '0.8',
  transition: 'opacity',
  '[data-checked="true"] &': {
    opacity: '0',
  },
  'label:hover &': {
    opacity: '0',
  },
});

const secretIconClosedClass = pandaCss({
  position: 'absolute',
  inset: '0',
  opacity: '0',
  transition: 'opacity',
  '[data-checked="true"] &': {
    opacity: '0.8',
  },
  'label:hover &': {
    opacity: '0.8',
  },
});

const secretCheckboxStyle = css`
  width: 1rem;
  height: 1rem;
  margin: 0;
  display: block;
  accent-color: rgb(var(--color-primary));
`;

const submitButtonClass = pandaCss({
  fontSize: '16',
  fontWeight: 'semibold',
});
