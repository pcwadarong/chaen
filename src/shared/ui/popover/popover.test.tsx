import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { Popover } from '@/shared/ui/popover/popover';

describe('Popover', () => {
  it('트리거와 다이얼로그 패널을 접근성 속성으로 연결한다', async () => {
    render(
      <Popover label="언어" panelLabel="언어 선택" value="한국어">
        {() => <button type="button">한국어</button>}
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: '언어 선택' });
    fireEvent.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: '언어 선택' });

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(dialog.id);
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    expect(trigger.getAttribute('aria-labelledby')).toBe(dialog.getAttribute('aria-labelledby'));
  });

  it('커스텀 트리거 콘텐츠를 표시한다', () => {
    render(
      <Popover label="테마" panelLabel="테마 선택" triggerContent={<span>아이콘 전용</span>}>
        {() => <button type="button">시스템</button>}
      </Popover>,
    );

    expect(screen.getByRole('button', { name: '테마 선택' }).textContent).toContain('아이콘 전용');
    expect(screen.queryByText('테마')).toBeNull();
  });

  it('별도의 triggerAriaLabel을 지원한다', () => {
    render(
      <Popover
        panelLabel="액션 메뉴"
        triggerAriaLabel="메뉴 열기"
        triggerContent={<span aria-hidden>...</span>}
      >
        {() => <button type="button">수정</button>}
      </Popover>,
    );

    expect(screen.getByRole('button', { name: '메뉴 열기' })).toBeTruthy();
  });

  it('controlled 모드에서는 onOpenChange만 호출하고 DOM 열림 상태는 prop 변경 전까지 유지한다', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Popover isOpen={false} onOpenChange={onOpenChange} panelLabel="액션 메뉴">
        {() => <button type="button">수정</button>}
      </Popover>,
    );

    fireEvent.click(screen.getByRole('button', { name: '액션 메뉴' }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('dialog', { name: '액션 메뉴' })).toBeNull();

    rerender(
      <Popover isOpen onOpenChange={onOpenChange} panelLabel="액션 메뉴">
        {() => <button type="button">수정</button>}
      </Popover>,
    );

    await screen.findByRole('dialog', { name: '액션 메뉴' });

    fireEvent.keyDown(window, { cancelable: true, key: 'Escape' });
    fireEvent.click(document.body);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('dialog', { name: '액션 메뉴' })).toBeTruthy();
  });
});
