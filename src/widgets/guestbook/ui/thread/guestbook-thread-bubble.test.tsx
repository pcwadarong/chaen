import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import type { GuestbookThreadItem } from '@/entities/guestbook/model/types';
import { GuestbookThreadBubble } from '@/widgets/guestbook/ui/thread/guestbook-thread-bubble';

vi.mock('@/features/guestbook-entry/model/use-manage-guestbook-entry-action-menu', () => ({
  useManageGuestbookEntryActionMenu: () => ({
    isOpen: false,
    longPressHandlers: {},
    setIsOpen: vi.fn(),
  }),
}));

vi.mock('@/features/guestbook-entry/ui/guestbook-entry-action-menu', () => ({
  GuestbookEntryActionMenu: () => <div data-testid="guestbook-entry-action-menu" />,
}));

const entry: GuestbookThreadItem = {
  author_blog_url: null,
  author_name: 'guest',
  content: 'secret content',
  created_at: '2026-03-17T00:00:00.000Z',
  deleted_at: null,
  id: 'thread-1',
  is_admin_author: false,
  is_content_masked: true,
  is_secret: true,
  parent_id: null,
  replies: [],
  updated_at: '2026-03-17T00:00:00.000Z',
};

describe('GuestbookThreadBubble', () => {
  it('비밀글 패널이 열리면 인라인 비밀번호 폼을 렌더링한다', () => {
    render(
      <GuestbookThreadBubble
        actionDeleteLabel="삭제"
        actionEditLabel="수정"
        actionMenuLabel="메뉴"
        actionMenuPanelLabel="패널"
        actionReplyLabel="답신"
        canReply={false}
        dateText={() => '2026-03-17'}
        deletedPlaceholder="삭제됨"
        entry={entry}
        isSecretPanelOpen
        isSecretRevealed={false}
        isSecretSubmitting={false}
        locale="ko"
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onReply={vi.fn()}
        onRevealSecret={vi.fn()}
        onToggleSecretPanel={vi.fn()}
        passwordInput="1234"
        revealLabel="보기"
        revealSecretPasswordLabel="비밀번호"
        revealSecretSubmitLabel="확인"
        revealSecretTitle="비밀글 확인"
        reportLabel="신고"
        secretError="오류"
        secretPlaceholder="비밀글입니다."
        setPasswordInput={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('비밀번호')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('오류');
  });

  it('비밀글 패널이 닫혀 있으면 보기 버튼으로 토글을 요청한다', () => {
    const onToggleSecretPanel = vi.fn();

    render(
      <GuestbookThreadBubble
        actionDeleteLabel="삭제"
        actionEditLabel="수정"
        actionMenuLabel="메뉴"
        actionMenuPanelLabel="패널"
        actionReplyLabel="답신"
        canReply={false}
        dateText={() => '2026-03-17'}
        deletedPlaceholder="삭제됨"
        entry={entry}
        isSecretPanelOpen={false}
        isSecretRevealed={false}
        isSecretSubmitting={false}
        locale="ko"
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onReply={vi.fn()}
        onRevealSecret={vi.fn()}
        onToggleSecretPanel={onToggleSecretPanel}
        passwordInput=""
        revealLabel="보기"
        revealSecretPasswordLabel="비밀번호"
        revealSecretSubmitLabel="확인"
        revealSecretTitle="비밀글 확인"
        reportLabel="신고"
        secretError={null}
        secretPlaceholder="비밀글입니다."
        setPasswordInput={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '보기' }));

    expect(onToggleSecretPanel).toHaveBeenCalledTimes(1);
  });
});
