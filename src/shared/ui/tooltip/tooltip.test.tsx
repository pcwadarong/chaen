import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { Tooltip } from '@/shared/ui/tooltip/tooltip';

describe('Tooltip', () => {
  it('focus 시 tooltip을 열고 trigger를 aria-describedby로 연결한다', async () => {
    render(
      <Tooltip content="굵게">
        <button type="button">B</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'B' });
    fireEvent.focus(trigger);

    const tooltip = await screen.findByRole('tooltip', { name: '굵게' });

    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);
  });

  it('blur 시 tooltip을 닫는다', async () => {
    render(
      <Tooltip content="기울임">
        <button type="button">I</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'I' });
    fireEvent.focus(trigger);
    await screen.findByRole('tooltip', { name: '기울임' });

    fireEvent.blur(trigger);

    await waitFor(() => {
      expect(screen.queryByRole('tooltip', { name: '기울임' })).toBeNull();
    });
  });

  it('tooltip을 document.body에 포털로 렌더링한다', async () => {
    render(
      <Tooltip content="링크">
        <button type="button">L</button>
      </Tooltip>,
    );

    fireEvent.focus(screen.getByRole('button', { name: 'L' }));

    const tooltip = await screen.findByRole('tooltip', { name: '링크' });

    expect(tooltip.parentElement).toBe(document.body);
  });

  it('hover와 focus 중 하나라도 유지되면 tooltip을 계속 노출한다', async () => {
    render(
      <Tooltip content="정렬">
        <button type="button">A</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'A' });

    fireEvent.mouseEnter(trigger);
    await screen.findByRole('tooltip', { name: '정렬' });
    fireEvent.focus(trigger);
    fireEvent.mouseLeave(trigger);

    expect(screen.getByRole('tooltip', { name: '정렬' })).toBeTruthy();

    fireEvent.blur(trigger);

    await waitFor(() => {
      expect(screen.queryByRole('tooltip', { name: '정렬' })).toBeNull();
    });
  });

  it('트리거가 viewport 상단에 가까우면 tooltip을 아래에 배치한다', async () => {
    render(
      <Tooltip content="유튜브">
        <button type="button">Y</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'Y' });
    const root = trigger.parentElement as HTMLSpanElement;

    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({
      bottom: 20,
      height: 16,
      left: 10,
      right: 30,
      toJSON: () => undefined,
      top: 4,
      width: 20,
      x: 10,
      y: 4,
    });

    fireEvent.focus(trigger);

    const tooltip = await screen.findByRole('tooltip', { name: '유튜브' });

    expect(tooltip.style.top).toBe('28px');
    expect(tooltip.style.transform).toBe('translate(-50%, 0)');
  });

  it('openOnFocus가 false면 focus와 blur만으로 tooltip 상태를 바꾸지 않는다', () => {
    render(
      <Tooltip content="이미지 축소" openOnFocus={false}>
        <button type="button">-</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: '-' });

    fireEvent.focus(trigger);
    expect(screen.queryByRole('tooltip', { name: '이미지 축소' })).toBeNull();

    fireEvent.blur(trigger);
    expect(screen.queryByRole('tooltip', { name: '이미지 축소' })).toBeNull();

    fireEvent.mouseEnter(trigger);
    expect(screen.getByRole('tooltip', { name: '이미지 축소' })).toBeTruthy();

    fireEvent.mouseLeave(trigger);
    expect(screen.queryByRole('tooltip', { name: '이미지 축소' })).toBeNull();
  });

  it('portalClassName이 전달되면 tooltip 포털 요소 클래스에 병합되어야 한다', async () => {
    render(
      <Tooltip content="링크 복사" portalClassName="tooltip-portal-test">
        <button type="button">C</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'C' });
    fireEvent.focus(trigger);

    const tooltip = await screen.findByRole('tooltip', { name: '링크 복사' });

    expect(tooltip.className).toContain('tooltip-portal-test');
  });
});
