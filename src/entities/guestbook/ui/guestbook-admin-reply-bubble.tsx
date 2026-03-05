'use client';

import type { CSSProperties } from 'react';

import type { GuestbookEntry } from '@/entities/guestbook/model/types';
import { useAuth } from '@/shared/providers';

type GuestbookAdminReplyBubbleProps = {
  actionDeleteLabel: string;
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
export const GuestbookAdminReplyBubble = ({
  actionDeleteLabel,
  actionEditLabel,
  entry,
  dateText,
  onDelete,
  onEdit,
}: GuestbookAdminReplyBubbleProps) => {
  const { isAdmin } = useAuth();

  return (
    <article style={wrapperStyle}>
      <div style={bubbleStyle}>
        <p style={contentStyle}>{entry.content}</p>
        <footer style={footerStyle}>
          <div style={actionRowStyle}>
            {isAdmin && (
              <>
                <button onClick={() => onEdit(entry)} style={actionButtonStyle} type="button">
                  {actionEditLabel}
                </button>
                <button onClick={() => onDelete(entry)} style={actionButtonStyle} type="button">
                  {actionDeleteLabel}
                </button>
              </>
            )}
          </div>
          <time dateTime={entry.created_at} style={dateStyle}>
            {dateText}
          </time>
        </footer>
      </div>
    </article>
  );
};

const wrapperStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  width: '100%',
};

const bubbleStyle: CSSProperties = {
  width: 'fit-content',
  maxWidth: 'min(640px, 90%)',
  padding: '1rem 1.1rem',
  borderRadius: '1rem',
  backgroundColor: 'rgb(var(--color-text) / 0.78)',
  color: 'rgb(var(--color-surface))',
  display: 'grid',
  gap: '0.5rem',
};

const contentStyle: CSSProperties = {
  whiteSpace: 'pre-wrap',
  lineHeight: 1.55,
};

const footerStyle: CSSProperties = {
  display: 'flex',
  gap: '0.35rem',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  fontSize: '0.82rem',
};

const actionRowStyle: CSSProperties = {
  display: 'flex',
  gap: '0.35rem',
};

const actionButtonStyle: CSSProperties = {
  border: 'none',
  textDecoration: 'underline',
};

const dateStyle: CSSProperties = {
  justifySelf: 'end',
  color: 'rgb(var(--color-surface) / 0.65)',
  fontSize: '0.86rem',
};
