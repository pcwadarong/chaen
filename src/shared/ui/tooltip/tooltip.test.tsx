import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { Tooltip } from '@/shared/ui/tooltip/tooltip';

describe('Tooltip', () => {
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

  it('트리거가 viewport 상단에 가까우면 tooltip을 아래에 배치한다', async () => {
    render(
      <Tooltip content="유튜브" preferredPlacement="auto">
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

  it('preferredPlacement가 top이면 상단 여백이 좁아도 tooltip을 위쪽에 고정한다', async () => {
    render(
      <Tooltip content="이미지 액션" preferredPlacement="top">
        <button type="button">T</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'T' });
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

    const tooltip = await screen.findByRole('tooltip', { name: '이미지 액션' });

    expect(tooltip.style.top).toBe('-4px');
    expect(tooltip.style.transform).toBe('translate(-50%, -100%)');
  });
});
