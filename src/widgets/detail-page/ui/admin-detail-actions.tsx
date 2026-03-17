'use client';

import React from 'react';
import { useFormStatus } from 'react-dom';
import { css } from 'styled-system/css';

import { Link } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button/button';

type AdminDetailActionsProps = {
  deleteAction: () => Promise<void>;
  deleteConfirmMessage?: string;
  deleteLabel?: string;
  editHref: string;
  editLabel?: string;
};

type DeleteSubmitButtonProps = {
  deleteLabel: string;
};

const DeleteSubmitButton = ({ deleteLabel }: DeleteSubmitButtonProps) => {
  const { pending } = useFormStatus();

  return (
    <Button
      className={actionButtonClass}
      disabled={pending}
      size="sm"
      tone="white"
      type="submit"
      variant="ghost"
    >
      {pending ? '삭제 중...' : deleteLabel}
    </Button>
  );
};

/**
 * 관리자 전용 상세 액션 영역에서 수정/삭제 버튼을 함께 렌더링합니다.
 */
export const AdminDetailActions = ({
  deleteAction,
  deleteConfirmMessage = '정말로 삭제하시겠습니까?',
  deleteLabel = '삭제',
  editHref,
  editLabel = '수정',
}: AdminDetailActionsProps) => {
  /**
   * 삭제 직전 사용자 확인을 받아 의도치 않은 삭제를 막습니다.
   */
  const handleDeleteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (window.confirm(deleteConfirmMessage)) {
      return;
    }

    event.preventDefault();
  };

  return (
    <div className={actionsGroupClass}>
      <Button asChild className={actionButtonClass} size="sm" tone="white" variant="ghost">
        <Link href={editHref}>{editLabel}</Link>
      </Button>
      <span aria-hidden className={dividerClass} />
      <form action={deleteAction} className={deleteFormClass} onSubmit={handleDeleteSubmit}>
        <DeleteSubmitButton deleteLabel={deleteLabel} />
      </form>
    </div>
  );
};

const actionsGroupClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: '0',
});

const deleteFormClass = css({
  display: 'inline-flex',
});

const dividerClass = css({
  width: '[1px]',
  height: '[1.5rem]',
  background: 'surfaceStrong',
});

const actionButtonClass = css({
  minHeight: '[unset]',
  px: '3',
  py: '0',
  fontSize: 'sm',
  '@media (min-width: 961px)': {
    fontSize: 'md',
  },
});
