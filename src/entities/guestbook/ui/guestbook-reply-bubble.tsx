'use client';

import React from 'react';
import { css } from 'styled-system/css';

import { useGuestbookBubbleActionMenu } from '@/entities/guestbook/lib/use-guestbook-bubble-action-menu';
import type { GuestbookEntry } from '@/entities/guestbook/model/types';
import { GuestbookEntryActionMenu } from '@/entities/guestbook/ui/guestbook-entry-action-menu';
import { GuestbookEntryBubble } from '@/entities/guestbook/ui/guestbook-entry-bubble';
import { useAuth } from '@/shared/providers';

type GuestbookReplyBubbleProps = {
  actionDeleteLabel: string;
  actionMenuLabel: string;
  actionMenuPanelLabel: string;
  deletedPlaceholder: string;
  actionEditLabel: string;
  entry: GuestbookEntry;
  dateText: string;
  onDelete: (entry: GuestbookEntry) => void;
  onEdit: (entry: GuestbookEntry) => void;
  reportLabel: string;
};

/**
 * 관리자 대댓글 버블을 렌더링합니다.
 * 우측 정렬 + primary 톤 스타일로 일반 댓글과 시각적으로 분리합니다.
 */
export const GuestbookReplyBubble = ({
  actionDeleteLabel,
  actionMenuLabel,
  actionMenuPanelLabel,
  deletedPlaceholder,
  actionEditLabel,
  entry,
  dateText,
  onDelete,
  onEdit,
  reportLabel,
}: GuestbookReplyBubbleProps) => {
  const { isAdmin } = useAuth();
  const isDeleted = Boolean(entry.deleted_at);
  const { isOpen, longPressHandlers, setIsOpen } = useGuestbookBubbleActionMenu({
    enabled: !isDeleted,
  });

  return (
    <article {...longPressHandlers}>
      <GuestbookEntryBubble
        action={
          !isDeleted ? (
            <GuestbookEntryActionMenu
              actionDeleteLabel={actionDeleteLabel}
              actionEditLabel={actionEditLabel}
              actionMenuLabel={actionMenuLabel}
              actionMenuPanelLabel={actionMenuPanelLabel}
              isOpen={isOpen}
              onDelete={isAdmin ? () => onDelete(entry) : undefined}
              onEdit={isAdmin ? () => onEdit(entry) : undefined}
              onOpenChange={setIsOpen}
              reportLabel={reportLabel}
            />
          ) : null
        }
        actionSide="start"
        actionVerticalAlign="start"
        align="end"
        meta={{
          dateText,
          dateTime: entry.created_at,
          position: 'bottom',
        }}
        variant="reply"
      >
        <p className={contentClass}>{isDeleted ? deletedPlaceholder : entry.content}</p>
      </GuestbookEntryBubble>
    </article>
  );
};

const contentClass = css({
  whiteSpace: 'pre-wrap',
  lineHeight: 'normal',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
});
