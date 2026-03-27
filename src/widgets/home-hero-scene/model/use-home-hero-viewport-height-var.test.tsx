// @vitest-environment jsdom

import { render, waitFor } from '@testing-library/react';
import React, { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useHomeHeroViewportHeightVar } from '@/widgets/home-hero-scene/model/use-home-hero-viewport-height-var';

class ResizeObserverMock {
  public observe = vi.fn();

  public disconnect = vi.fn();
}

/**
 * 테스트용 hero section에 viewport 높이 동기화 훅을 연결합니다.
 */
const ViewportHeightProbe = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useHomeHeroViewportHeightVar(sectionRef);

  return <section data-testid="hero-section" ref={sectionRef} />;
};

describe('useHomeHeroViewportHeightVar', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 900,
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.style.removeProperty('--home-hero-viewport-height');
  });

  it('app-frame viewport가 있으면 sibling도 읽을 수 있도록 shared viewport scope에 높이 변수를 기록해야 한다', async () => {
    const { getByTestId } = render(
      <div data-app-scroll-viewport="true" data-testid="scroll-viewport">
        <ViewportHeightProbe />
        <div data-testid="contact-sibling" />
      </div>,
    );
    const viewportElement = getByTestId('scroll-viewport');
    const sectionElement = getByTestId('hero-section');

    Object.defineProperty(viewportElement, 'clientHeight', {
      configurable: true,
      value: 720,
    });

    window.dispatchEvent(new Event('resize'));

    await waitFor(() => {
      expect(viewportElement.style.getPropertyValue('--home-hero-viewport-height')).toBe('720px');
    });
    expect(sectionElement.style.getPropertyValue('--home-hero-viewport-height')).toBe('');
  });
});
