'use client';

import { css } from '@emotion/react';
import React from 'react';

import { Button } from '@/shared/ui/button/button';
import { ArrowCurveLeftRightIcon } from '@/shared/ui/icons/app-icons';

type GuestbookComposeReplyPreviewProps = {
  onReset: () => void;
  replyPreviewLabel: string;
  replyTargetContent: string | null;
  replyTargetResetLabel: string;
};

/** 답신 대상 콘텐츠 미리보기와 해제 버튼을 렌더링합니다. */
export const GuestbookComposeReplyPreview = ({
  onReset,
  replyPreviewLabel,
  replyTargetContent,
  replyTargetResetLabel,
}: GuestbookComposeReplyPreviewProps) => (
  <aside aria-label={replyPreviewLabel} css={replyPreviewStyle}>
    <ArrowCurveLeftRightIcon aria-hidden size="sm" />
    <p css={replyPreviewTextStyle}>{replyTargetContent}</p>
    <Button
      onClick={onReset}
      css={replyPreviewCloseStyle}
      tone="black"
      type="button"
      variant="underline"
    >
      {replyTargetResetLabel}
    </Button>
  </aside>
);

const replyPreviewStyle = css`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-2);
  min-height: 2.7rem;
  padding: var(--space-2) var(--space-3);
`;

const replyPreviewTextStyle = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgb(var(--color-muted));
`;

const replyPreviewCloseStyle = css`
  justify-self: end;
`;
