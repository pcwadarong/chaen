'use client';

import { css } from '@emotion/react';

import type { GuestbookEntry } from '@/entities/guestbook/model/types';
import { GuestbookEntryBubble } from '@/entities/guestbook/ui/guestbook-entry-bubble';
import { useAuth } from '@/shared/providers';
import { Button } from '@/shared/ui/button/button';

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
 * 우측 정렬 + 어두운 톤 스타일로 일반 댓글과 시각적으로 분리합니다.
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
        footer={
          <>
            <div css={actionRowStyle}>
              {isAdmin && !isDeleted && (
                <>
                  <Button
                    onClick={() => onEdit(entry)}
                    css={replyActionStyle}
                    tone="white"
                    variant="underline"
                  >
                    {actionEditLabel}
                  </Button>
                  <Button
                    onClick={() => onDelete(entry)}
                    css={replyActionStyle}
                    tone="white"
                    variant="underline"
                  >
                    {actionDeleteLabel}
                  </Button>
                </>
              )}
            </div>
            <time dateTime={entry.created_at} css={dateStyle}>
              {dateText}
            </time>
          </>
        }
        maxWidth="min(640px, 90%)"
        tone="inverse"
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
  gap: var(--space-3);
`;

const dateStyle = css`
  justify-self: end;
  color: rgb(var(--color-surface) / 0.65);
  font-size: var(--font-size-14);
`;

const replyActionStyle = css`
  color: rgb(var(--color-surface) / 0.65);
`;
