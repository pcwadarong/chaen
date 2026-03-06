import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { SwitcherPopover } from '@/shared/ui/switcher-popover/switcher-popover';

describe('SwitcherPopover', () => {
  it('트리거와 다이얼로그 패널을 접근성 속성으로 연결한다', async () => {
    render(
      <SwitcherPopover label="언어" panelLabel="언어 선택" value="한국어">
        {() => <button type="button">한국어</button>}
      </SwitcherPopover>,
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
      <SwitcherPopover label="테마" panelLabel="테마 선택" value="시스템">
        {() => (
          <div>
            <button type="button">시스템</button>
            <button type="button">라이트</button>
          </div>
        )}
      </SwitcherPopover>,
    );

    fireEvent.click(screen.getByRole('button', { name: '테마 선택' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '시스템' })).toBe(document.activeElement);
    });
  });

  it('Escape 키로 닫히면 트리거 버튼으로 포커스를 복원한다', async () => {
    render(
      <SwitcherPopover label="테마" panelLabel="테마 선택" value="시스템">
        {() => <button type="button">시스템</button>}
      </SwitcherPopover>,
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
      <SwitcherPopover label="테마" panelLabel="테마 선택" value="시스템">
        {() => <button type="button">시스템</button>}
      </SwitcherPopover>,
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
      <SwitcherPopover
        label="테마"
        panelLabel="테마 선택"
        triggerContent={<span>아이콘 전용</span>}
      >
        {() => <button type="button">시스템</button>}
      </SwitcherPopover>,
    );

    expect(screen.getByRole('button', { name: '테마 선택' }).textContent).toContain('아이콘 전용');
    expect(screen.queryByText('테마')).toBeNull();
  });
});
