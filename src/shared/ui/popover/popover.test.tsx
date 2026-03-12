import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('열리면 첫 번째 포커스 가능한 옵션으로 포커스를 이동한다', async () => {
    render(
      <Popover label="테마" panelLabel="테마 선택" value="시스템">
        {() => (
          <div>
            <button type="button">시스템</button>
            <button type="button">라이트</button>
          </div>
        )}
      </Popover>,
    );

    fireEvent.click(screen.getByRole('button', { name: '테마 선택' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '시스템' })).toBe(document.activeElement);
    });
  });

  it('Escape 키로 닫히면 트리거 버튼으로 포커스를 복원한다', async () => {
    render(
      <Popover label="테마" panelLabel="테마 선택" value="시스템">
        {() => <button type="button">시스템</button>}
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: '테마 선택' });
    trigger.focus();

    fireEvent.click(trigger);
    await screen.findByRole('dialog', { name: '테마 선택' });

    fireEvent.keyDown(window, { cancelable: true, key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '테마 선택' })).toBeNull();
      expect(trigger).toBe(document.activeElement);
    });
  });

  it('외부 click 이벤트로 팝오버를 닫는다', async () => {
    render(
      <Popover label="테마" panelLabel="테마 선택" value="시스템">
        {() => <button type="button">시스템</button>}
      </Popover>,
    );

    fireEvent.click(screen.getByRole('button', { name: '테마 선택' }));
    await screen.findByRole('dialog', { name: '테마 선택' });

    fireEvent.click(document.body);

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '테마 선택' })).toBeNull();
    });
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

  it('portal 모드에서는 패널을 document.body에 렌더링한다', async () => {
    render(
      <Popover panelLabel="링크 삽입" portalPlacement="start" renderInPortal>
        {() => <button type="button">삽입</button>}
      </Popover>,
    );

    fireEvent.click(screen.getByRole('button', { name: '링크 삽입' }));

    const dialog = await screen.findByRole('dialog', { name: '링크 삽입' });

    expect(dialog.parentElement).toBe(document.body);
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
