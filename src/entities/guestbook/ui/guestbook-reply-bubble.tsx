'use client';

import { css } from '@emotion/react';

import type { GuestbookEntry } from '@/entities/guestbook/model/types';
import { GuestbookEntryBubble } from '@/entities/guestbook/ui/guestbook-entry-bubble';
import { useAuth } from '@/shared/providers';
import { Button } from '@/shared/ui/button/button';
import { EditIcon, TrashIcon } from '@/shared/ui/icons/app-icons';

type GuestbookReplyBubbleProps = {
  actionDeleteLabel: string;
  deletedPlaceholder: string;
  actionEditLabel: string;
  entry: GuestbookEntry;
  dateText: string;
  onDelete: (entry: GuestbookEntry) => void;
  onEdit: (entry: GuestbookEntry) => void;
};

/**
 * 관리자 대댓글 버블을 렌더링합니다.
 * 우측 정렬 + primary 톤 스타일로 일반 댓글과 시각적으로 분리합니다.
 */
export const GuestbookReplyBubble = ({
  actionDeleteLabel,
  deletedPlaceholder,
  actionEditLabel,
  entry,
  dateText,
  onDelete,
  onEdit,
}: GuestbookReplyBubbleProps) => {
  const { isAdmin } = useAuth();
  const isDeleted = Boolean(entry.deleted_at);

  return (
    <article css={wrapperStyle}>
      <GuestbookEntryBubble
        align="end"
        bottom={
          <div css={actionRowStyle}>
            {isAdmin && !isDeleted ? (
              <>
                <Button
                  onClick={() => onEdit(entry)}
                  css={actionButtonStyle}
                  leadingVisual={<EditIcon aria-hidden size="sm" />}
                  tone="white"
                  type="button"
                  variant="underline"
                >
                  {actionEditLabel}
                </Button>
                <Button
                  onClick={() => onDelete(entry)}
                  css={actionButtonStyle}
                  leadingVisual={<TrashIcon aria-hidden size="sm" />}
                  tone="white"
                  type="button"
                  variant="underline"
                >
                  {actionDeleteLabel}
                </Button>
              </>
            ) : null}
            <time dateTime={entry.created_at} css={dateStyle}>
              {dateText}
            </time>
          </div>
        }
        maxWidth="min(640px, 90%)"
        tone="primary"
      >
        <p css={contentStyle}>{isDeleted ? deletedPlaceholder : entry.content}</p>
      </GuestbookEntryBubble>
    </article>
  );
};

const wrapperStyle = css`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

const contentStyle = css`
  white-space: pre-wrap;
  line-height: var(--line-height-155);
`;

const actionRowStyle = css`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

const dateStyle = css`
  color: rgb(var(--color-muted));
  font-size: var(--font-size-14);
  margin-left: auto;
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

  & > span[aria-hidden='true'] {
    opacity: 0.8;
  }
`;
