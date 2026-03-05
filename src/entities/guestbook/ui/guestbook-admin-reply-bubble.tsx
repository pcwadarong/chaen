'use client';

import type { CSSProperties } from 'react';

import type { GuestbookEntry } from '@/entities/guestbook/model/types';

type GuestbookAdminReplyBubbleProps = {
  entry: GuestbookEntry;
  dateText: string;
};

/**
 * 관리자 대댓글 버블을 렌더링합니다.
 * 우측 정렬 + 어두운 톤 스타일로 일반 댓글과 시각적으로 분리합니다.
 */
export const GuestbookAdminReplyBubble = ({ entry, dateText }: GuestbookAdminReplyBubbleProps) => (
  <article style={wrapperStyle}>
    <div style={bubbleStyle}>
      <p style={contentStyle}>{entry.content}</p>
      <time dateTime={entry.created_at} style={dateStyle}>
        {dateText}
      </time>
    </div>
  </article>
);

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

const dateStyle: CSSProperties = {
  justifySelf: 'end',
  color: 'rgb(var(--color-surface) / 0.65)',
  fontSize: '0.86rem',
};
