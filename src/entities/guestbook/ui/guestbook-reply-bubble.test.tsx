import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import type { GuestbookEntry } from '@/entities/guestbook/model/types';
import { GuestbookReplyBubble } from '@/entities/guestbook/ui/guestbook-reply-bubble';

const authState = {
  isAdmin: false,
};

vi.mock('@/shared/providers', () => ({
  useAuth: () => authState,
}));

const createReply = (overrides?: Partial<GuestbookEntry>): GuestbookEntry => ({
  author_blog_url: 'https://reply.example.com',
  author_name: 'admin',
  content: 'reply body',
  created_at: '2026-03-06T00:00:00.000Z',
  deleted_at: null,
  id: 'reply-1',
  is_admin_author: true,
  is_content_masked: false,
  is_secret: false,
  parent_id: 'thread-1',
  updated_at: '2026-03-06T00:00:00.000Z',
  ...overrides,
});

describe('GuestbookReplyBubble', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isAdmin = false;
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

  it('외부 링크 메타와 팝오버 메뉴를 렌더링한다', () => {
    render(
      <GuestbookReplyBubble
        actionDeleteLabel="삭제"
        actionEditLabel="수정"
        actionMenuLabel="메뉴 열기"
        actionMenuPanelLabel="방명록 액션 메뉴"
        dateText="2026-03-06"
        deletedPlaceholder="삭제된 글입니다."
        entry={createReply()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        reportLabel="신고"
      />,
    );

    expect(screen.queryByRole('link', { name: 'admin' })).toBeNull();
    expect(screen.getByText('2026-03-06')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }));

    expect(screen.getByRole('dialog', { name: '방명록 액션 메뉴' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '수정' })).toBeNull();
    expect(screen.queryByRole('button', { name: '삭제' })).toBeNull();
    expect(screen.getByRole('button', { name: '신고' })).toBeTruthy();
  });
});
