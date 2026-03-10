import React from 'react';
import { css } from 'styled-system/css';

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
  <div className={rightActionsClass}>
    {allowSecretToggle ? (
      <div className={secretControlGroupClass}>
        <input
          id={secretCheckboxId}
          aria-label={secretLabel}
          checked={isSecret}
          className={secretCheckboxClass}
          onChange={event => onSecretChange(event.target.checked)}
          type="checkbox"
        />
        <label
          aria-label={secretLabel}
          className={secretToggleLabelClass}
          data-checked={isSecret ? 'true' : 'false'}
          htmlFor={secretCheckboxId}
        >
          <span
            aria-hidden
            className={secretIconStackClass}
            data-checked={isSecret ? 'true' : 'false'}
          >
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

const secretControlGroupClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
});

const rightActionsClass = css({
  display: 'inline-flex',
  gap: '2',
  flex: '[0 0 auto]',
  marginLeft: 'auto',
  alignSelf: 'flex-end',
});

const secretToggleLabelClass = css({
  p: '0',
  width: '[2.25rem]',
  height: '[2.25rem]',
  borderRadius: 'full',
  background: 'transparent',
  color: 'muted',
  border: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: '[0]',
  cursor: 'pointer',
  transition: '[color 180ms ease]',
  _hover: {
    background: 'transparent',
    color: 'text',
  },
  'input:focus-visible + &': {
    background: 'transparent',
    color: 'text',
  },
});

const secretIconStackClass = css({
  position: 'relative',
  width: '[1.125rem]',
  height: '[1.125rem]',
  display: 'inline-block',
  transform: 'translateY(-1px)',
});

const secretIconOpenClass = css({
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

const secretIconClosedClass = css({
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

const secretCheckboxClass = css({
  width: '4',
  height: '4',
  m: '0',
  display: 'block',
  accentColor: 'primary',
});

const submitButtonClass = css({
  fontSize: 'md',
  fontWeight: 'semibold',
  px: '4',
});
