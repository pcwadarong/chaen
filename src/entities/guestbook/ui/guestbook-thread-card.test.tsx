import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import type { GuestbookThreadItem } from '@/entities/guestbook/model/types';

import { GuestbookThreadCard } from './guestbook-thread-card';

vi.mock('@/entities/guestbook/ui/guestbook-reply-bubble', () => ({
  GuestbookReplyBubble: () => <div>reply</div>,
}));

const createThread = (overrides?: Partial<GuestbookThreadItem>): GuestbookThreadItem => ({
  author_blog_url: null,
  author_name: 'guest',
  content: 'hello',
  created_at: '2026-03-06T00:00:00.000Z',
  deleted_at: null,
  id: 'thread-1',
  is_admin_reply: false,
  is_content_masked: false,
  is_secret: false,
  parent_id: null,
  replies: [],
  updated_at: '2026-03-06T00:00:00.000Z',
  ...overrides,
});

describe('GuestbookThreadCard', () => {
  it('삭제된 원댓글은 삭제 문구를 보여주고 액션을 숨긴다', () => {
    const onDelete = vi.fn();

    render(
      <GuestbookThreadCard
        actionDeleteLabel="삭제"
        actionEditLabel="수정"
        actionReplyLabel="답신"
        canReply
        dateText={() => '2026-03-06'}
        deletedPlaceholder="삭제된 글입니다."
        entry={createThread({ deleted_at: '2026-03-06T01:00:00.000Z' })}
        onDeleteReply={vi.fn()}
        onDelete={onDelete}
        onEditReply={vi.fn()}
        onEdit={vi.fn()}
        onReply={vi.fn()}
        onRevealSecret={vi.fn()}
        revealLabel="확인하기"
        revealSecretErrorLabel="오류"
        revealSecretPasswordLabel="비밀번호"
        revealSecretSubmitLabel="확인"
        revealSecretTitle="비밀글 확인"
        secretLabel="비밀글"
        secretPlaceholder="비밀글입니다."
      />,
    );

    expect(screen.getByText('삭제된 글입니다.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '수정' })).toBeNull();
    expect(screen.queryByRole('button', { name: '삭제' })).toBeNull();
    expect(screen.queryByRole('button', { name: '답신' })).toBeNull();
    fireEvent.click(screen.getByText('삭제된 글입니다.'));
    expect(onDelete).not.toHaveBeenCalled();
  });
});
