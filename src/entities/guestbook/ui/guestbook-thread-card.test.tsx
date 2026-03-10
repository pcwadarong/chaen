import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import type { GuestbookThreadItem } from '@/entities/guestbook/model/types';

import { GuestbookThreadCard } from './guestbook-thread-card';

vi.mock('@/features/guestbook-feed/api/guestbook-actions', () => ({
  initialVerifyGuestbookSecretState: {
    data: null,
    errorMessage: null,
    ok: false,
  },
  verifyGuestbookSecretAction: vi.fn(),
}));

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
  is_admin_author: false,
  is_content_masked: false,
  is_secret: false,
  parent_id: null,
  replies: [],
  updated_at: '2026-03-06T00:00:00.000Z',
  ...overrides,
});

describe('GuestbookThreadCard', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: query.includes('pointer: coarse'),
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
      writable: true,
    });
  });

  it('삭제된 원댓글은 삭제 문구를 보여주고 액션을 숨긴다', () => {
    const onDelete = vi.fn();

    render(
      <GuestbookThreadCard
        actionDeleteLabel="삭제"
        actionEditLabel="수정"
        actionMenuLabel="메뉴 열기"
        actionMenuPanelLabel="방명록 액션 메뉴"
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
        onRevealSecretSuccess={vi.fn()}
        reportLabel="신고"
        revealLabel="확인하기"
        revealSecretPasswordLabel="비밀번호"
        revealSecretSubmitLabel="확인"
        revealSecretTitle="비밀글 확인"
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

  it('비밀글 보기 버튼을 누르면 인라인 비밀번호 입력 폼이 나타난다', () => {
    render(
      <GuestbookThreadCard
        actionDeleteLabel="삭제"
        actionEditLabel="수정"
        actionMenuLabel="메뉴 열기"
        actionMenuPanelLabel="방명록 액션 메뉴"
        actionReplyLabel="답신"
        canReply={false}
        dateText={() => '2026-03-06'}
        deletedPlaceholder="삭제된 글입니다."
        entry={createThread({ is_content_masked: true, is_secret: true })}
        onDeleteReply={vi.fn()}
        onDelete={vi.fn()}
        onEditReply={vi.fn()}
        onEdit={vi.fn()}
        onReply={vi.fn()}
        onRevealSecretSuccess={vi.fn()}
        reportLabel="신고"
        revealLabel="보기"
        revealSecretPasswordLabel="비밀번호"
        revealSecretSubmitLabel="확인"
        revealSecretTitle="비밀글 확인"
        secretPlaceholder="비밀글입니다."
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '보기' }));

    expect(screen.getByLabelText('비밀번호')).toBeTruthy();
    expect(screen.getByRole('button', { name: '확인' })).toBeTruthy();
  });

  it('외부 링크가 있으면 이름 옆 아이콘 링크를 노출하고 kebab 메뉴를 연다', () => {
    render(
      <GuestbookThreadCard
        actionDeleteLabel="삭제"
        actionEditLabel="수정"
        actionMenuLabel="메뉴 열기"
        actionMenuPanelLabel="방명록 액션 메뉴"
        actionReplyLabel="답신"
        canReply
        dateText={() => '2026-03-06'}
        deletedPlaceholder="삭제된 글입니다."
        entry={createThread({ author_blog_url: 'https://example.com' })}
        onDeleteReply={vi.fn()}
        onDelete={vi.fn()}
        onEditReply={vi.fn()}
        onEdit={vi.fn()}
        onReply={vi.fn()}
        onRevealSecretSuccess={vi.fn()}
        reportLabel="신고"
        revealLabel="보기"
        revealSecretPasswordLabel="비밀번호"
        revealSecretSubmitLabel="확인"
        revealSecretTitle="비밀글 확인"
        secretPlaceholder="비밀글입니다."
      />,
    );

    expect(screen.getByRole('link', { name: 'guest' }).getAttribute('href')).toBe(
      'https://example.com',
    );
    expect(screen.queryByRole('button', { name: '답신' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }));

    expect(screen.getByRole('dialog', { name: '방명록 액션 메뉴' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '답신' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '수정' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '삭제' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '신고' })).toBeTruthy();
  });

  it('coarse pointer 환경에서는 long press로 메뉴를 연다', () => {
    vi.useFakeTimers();

    render(
      <GuestbookThreadCard
        actionDeleteLabel="삭제"
        actionEditLabel="수정"
        actionMenuLabel="메뉴 열기"
        actionMenuPanelLabel="방명록 액션 메뉴"
        actionReplyLabel="답신"
        canReply
        dateText={() => '2026-03-06'}
        deletedPlaceholder="삭제된 글입니다."
        entry={createThread()}
        onDeleteReply={vi.fn()}
        onDelete={vi.fn()}
        onEditReply={vi.fn()}
        onEdit={vi.fn()}
        onReply={vi.fn()}
        onRevealSecretSuccess={vi.fn()}
        reportLabel="신고"
        revealLabel="보기"
        revealSecretPasswordLabel="비밀번호"
        revealSecretSubmitLabel="확인"
        revealSecretTitle="비밀글 확인"
        secretPlaceholder="비밀글입니다."
      />,
    );

    fireEvent.pointerDown(screen.getByText('hello'), { pointerType: 'touch' });
    act(() => {
      vi.advanceTimersByTime(430);
    });

    expect(screen.getByRole('dialog', { name: '방명록 액션 메뉴' })).toBeTruthy();

    vi.useRealTimers();
  });
});
