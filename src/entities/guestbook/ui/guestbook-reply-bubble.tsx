'use client';

import { css } from '@emotion/react';

import type { GuestbookEntry } from '@/entities/guestbook/model/types';
import { useAuth } from '@/shared/providers';

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
      <div css={bubbleStyle}>
        <p css={contentStyle}>{isDeleted ? deletedPlaceholder : entry.content}</p>
        <footer css={footerStyle}>
          <div css={actionRowStyle}>
            {isAdmin && !isDeleted && (
              <>
                <button onClick={() => onEdit(entry)} css={actionButtonStyle} type="button">
                  {actionEditLabel}
                </button>
                <button onClick={() => onDelete(entry)} css={actionButtonStyle} type="button">
                  {actionDeleteLabel}
                </button>
              </>
            )}
          </div>
          <time dateTime={entry.created_at} css={dateStyle}>
            {dateText}
          </time>
        </footer>
      </div>
    </article>
  );
};

const wrapperStyle = css`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

const bubbleStyle = css`
  width: fit-content;
  max-width: min(640px, 90%);
  padding: var(--space-4) var(--space-4);
  border-radius: var(--radius-l);
  background-color: rgb(var(--color-text) / 0.78);
  color: rgb(var(--color-surface));
  display: grid;
  gap: var(--space-2);
`;

const contentStyle = css`
  white-space: pre-wrap;
  line-height: var(--line-height-155);
`;

const footerStyle = css`
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
  justify-content: flex-end;
  font-size: var(--font-size-12);
`;

const actionRowStyle = css`
  display: flex;
  gap: var(--space-1);
`;

const actionButtonStyle = css`
  border: none;
  text-decoration: underline;
`;

const dateStyle = css`
  justify-self: end;
  color: rgb(var(--color-surface) / 0.65);
  font-size: var(--font-size-14);
`;
