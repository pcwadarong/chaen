import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { GuestbookEntryActionMenu } from '@/features/manage-guestbook-entry/ui/guestbook-entry-action-menu';

const actionMenuButtonProps = vi.fn();

vi.mock('@/shared/ui/action-popover/action-popover', () => ({
  ActionMenuButton: (props: Record<string, unknown>) => {
    actionMenuButtonProps(props);

    return (
      <button
        aria-disabled={props.ariaDisabled ? 'true' : undefined}
        onClick={props.onClick as (() => void) | undefined}
        type="button"
      >
        {String(props.label)}
      </button>
    );
  },
  ActionPopover: ({
    children,
  }: {
    children: (helpers: { closePopover: () => void }) => React.ReactNode;
  }) => <div>{children({ closePopover: vi.fn() })}</div>,
}));

describe('GuestbookEntryActionMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reply/edit/delete 액션을 렌더링하고 클릭을 전달한다', () => {
    const onReply = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <GuestbookEntryActionMenu
        actionDeleteLabel="삭제"
        actionEditLabel="수정"
        actionMenuLabel="메뉴"
        actionMenuPanelLabel="액션 패널"
        actionReplyLabel="답신"
        isOpen={false}
        onDelete={onDelete}
        onEdit={onEdit}
        onOpenChange={vi.fn()}
        onReply={onReply}
        reportLabel="신고"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '답신' }));
    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));

    expect(onReply).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('report 버튼은 항상 비활성 상태로 렌더링한다', () => {
    render(
      <GuestbookEntryActionMenu
        actionDeleteLabel="삭제"
        actionEditLabel="수정"
        actionMenuLabel="메뉴"
        actionMenuPanelLabel="액션 패널"
        isOpen={false}
        onOpenChange={vi.fn()}
        reportLabel="신고"
      />,
    );

    expect(screen.getByRole('button', { name: '신고' }).getAttribute('aria-disabled')).toBe('true');
  });
});
