/* @vitest-environment jsdom */

import { act, render } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { HomeHeroMobileProjectSheet } from '@/widgets/home-hero-scene/ui/home-hero-mobile-project-sheet';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/widgets/project-showcase/ui/project-showcase', () => ({
  ProjectShowcase: () => <div data-testid="project-showcase" />,
}));

describe('HomeHeroMobileProjectSheet', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback =>
      window.setTimeout(() => callback(16), 16),
    );
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(frameId => {
      window.clearTimeout(frameId);
    });
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('열린 상태일 때, HomeHeroMobileProjectSheet는 dialog에서 inert를 제거해야 한다', async () => {
    render(
      <HomeHeroMobileProjectSheet isOpen items={[]} onClose={vi.fn()} title="Selected Projects" />,
    );

    await act(async () => {
      vi.advanceTimersByTime(64);
    });

    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;

    expect(dialog.hasAttribute('inert')).toBe(false);
    expect(dialog.getAttribute('aria-hidden')).toBe('false');
  });

  it('닫힘 애니메이션 중일 때, HomeHeroMobileProjectSheet는 dialog를 inert 상태로 유지해야 한다', async () => {
    const { rerender } = render(
      <HomeHeroMobileProjectSheet isOpen items={[]} onClose={vi.fn()} title="Selected Projects" />,
    );

    await act(async () => {
      vi.advanceTimersByTime(32);
    });

    await act(async () => {
      rerender(
        <HomeHeroMobileProjectSheet
          isOpen={false}
          items={[]}
          onClose={vi.fn()}
          title="Selected Projects"
        />,
      );
    });

    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;

    expect(dialog.hasAttribute('inert')).toBe(true);
    expect(dialog.getAttribute('aria-hidden')).toBe('true');
  });

  it('열린 상태에서 desktop scene mode로 전환되면 패널을 닫아야 한다', async () => {
    const onClose = vi.fn();

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 768,
      writable: true,
    });

    render(
      <HomeHeroMobileProjectSheet isOpen items={[]} onClose={onClose} title="Selected Projects" />,
    );

    await act(async () => {
      vi.advanceTimersByTime(32);
    });

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1600,
      writable: true,
    });

    await act(async () => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
