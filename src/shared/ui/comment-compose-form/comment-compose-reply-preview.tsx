import React from 'react';
import { css } from 'styled-system/css';

import { Button } from '@/shared/ui/button/button';
import { ArrowCurveLeftRightIcon } from '@/shared/ui/icons/app-icons';

type CommentComposeReplyPreviewProps = {
  onReset?: () => void;
  replyPreviewLabel: string;
  replyTargetContent: string | null;
  replyTargetResetLabel?: string;
};

/** 답신 대상 콘텐츠 미리보기와 선택 해제 버튼을 렌더링합니다. */
export const CommentComposeReplyPreview = ({
  onReset,
  replyPreviewLabel,
  replyTargetContent,
  replyTargetResetLabel,
}: CommentComposeReplyPreviewProps) => (
  <aside aria-label={replyPreviewLabel} className={replyPreviewClass}>
    <ArrowCurveLeftRightIcon aria-hidden size="sm" />
    <p className={replyPreviewTextClass}>{replyTargetContent}</p>
    {onReset && replyTargetResetLabel ? (
      <Button
        className={replyPreviewCloseClass}
        onClick={onReset}
        tone="black"
        type="button"
        variant="underline"
      >
        {replyTargetResetLabel}
      </Button>
    ) : null}
  </aside>
);

const replyPreviewClass = css({
  display: 'grid',
  gridTemplateColumns: '[auto 1fr auto]',
  alignItems: 'center',
  gap: '2',
  minHeight: '[2.7rem]',
  px: '3',
  py: '2',
});

const replyPreviewTextClass = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: 'muted',
});

const replyPreviewCloseClass = css({
  justifySelf: 'end',
});
