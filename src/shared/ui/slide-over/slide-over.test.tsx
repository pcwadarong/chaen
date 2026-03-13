import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { SlideOver } from '@/shared/ui/slide-over/slide-over';

import '@testing-library/jest-dom/vitest';

describe('SlideOver', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('열리면 dialog를 렌더링하고 배경 클릭으로 닫는다', async () => {
    const onClose = vi.fn();

    render(
      <SlideOver ariaLabel="테스트 패널" isOpen onClose={onClose}>
        <div>패널 내용</div>
      </SlideOver>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(32);
    });

    expect(screen.getByRole('dialog', { name: '테스트 패널' })).toBeTruthy();
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('닫힐 때 exit animation 후 언마운트한다', async () => {
    const { rerender } = render(
      <SlideOver ariaLabel="테스트 패널" isOpen onClose={() => undefined}>
        <div>패널 내용</div>
      </SlideOver>,
    );

    rerender(
      <SlideOver ariaLabel="테스트 패널" isOpen={false} onClose={() => undefined}>
        <div>패널 내용</div>
      </SlideOver>,
    );

    expect(screen.getByRole('dialog', { hidden: true })).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(720);
    });
    expect(screen.queryByRole('dialog', { hidden: true })).toBeNull();
  });
});
