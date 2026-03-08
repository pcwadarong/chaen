import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { ActionMenuButton, ActionPopover } from '@/shared/ui/action-popover/action-popover';

const TestActionPopover = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <ActionPopover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      panelLabel="액션 메뉴"
      triggerLabel="메뉴 열기"
    >
      {({ closePopover }) => (
        <>
          <ActionMenuButton label="수정" onClick={closePopover} />
          <ActionMenuButton ariaDisabled label="신고" />
        </>
      )}
    </ActionPopover>
  );
};

describe('ActionPopover', () => {
  it('트리거와 다이얼로그 패널을 접근성 속성으로 연결한다', async () => {
    render(<TestActionPopover />);

    const trigger = screen.getByRole('button', { name: '메뉴 열기' });
    fireEvent.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: '액션 메뉴' });

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(dialog.id);
  });

  it('Escape 키로 닫히면 트리거 버튼으로 포커스를 복원한다', async () => {
    render(<TestActionPopover />);

    const trigger = screen.getByRole('button', { name: '메뉴 열기' });
    trigger.focus();

    fireEvent.click(trigger);
    await screen.findByRole('dialog', { name: '액션 메뉴' });

    fireEvent.keyDown(window, { cancelable: true, key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '액션 메뉴' })).toBeNull();
      expect(trigger).toBe(document.activeElement);
    });
  });

  it('외부 pointerdown 이벤트로 팝오버를 닫는다', async () => {
    render(<TestActionPopover />);

    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }));
    await screen.findByRole('dialog', { name: '액션 메뉴' });

    fireEvent.pointerDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '액션 메뉴' })).toBeNull();
    });
  });
});
