// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { ContactScene } from '@/widgets/contact-scene/ui/contact-scene';
import { useBreakpoint } from '@/widgets/home-hero-scene/model/use-breakpoint';

import '@testing-library/jest-dom/vitest';

vi.mock('next/dynamic', () => ({
  default: () => {
    const DynamicComponent = () => <div data-testid="contact-scene-canvas" />;

    return DynamicComponent;
  },
}));

vi.mock('@/widgets/contact-strip/ui/contact-strip', () => ({
  ContactStrip: ({ layout = 'split' }: { layout?: 'centered' | 'split' }) => (
    <section data-testid="contact-strip" data-variant={layout} />
  ),
}));

vi.mock('@/widgets/home-hero-scene/model/use-breakpoint', () => ({
  useBreakpoint: vi.fn(),
}));

const mockedUseBreakpoint = vi.mocked(useBreakpoint);

describe('ContactScene', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 920,
      writable: true,
    });
    document.documentElement.style.setProperty('--global-nav-height', '0px');
  });

  it('모바일에서는 contact scene 자체를 렌더링하지 않아야 한다', () => {
    mockedUseBreakpoint.mockReturnValue({
      currentBP: 2,
      sceneViewportMode: 'stacked',
      viewportHeight: 920,
      viewportWidth: 768,
    });

    const { container } = render(<ContactScene />);

    expect(container.firstElementChild).toBeNull();
    expect(screen.queryByTestId('contact-scene-canvas')).toBeNull();
    expect(screen.queryByTestId('contact-strip')).toBeNull();
  });

  it('wide scene에서는 mount 이후 canvas와 split ContactStrip을 함께 렌더링해야 한다', async () => {
    mockedUseBreakpoint.mockReturnValue({
      currentBP: 4,
      sceneViewportMode: 'wide',
      viewportHeight: 920,
      viewportWidth: 1280,
    });

    const { container } = render(<ContactScene />);

    expect(container.firstElementChild?.tagName).toBe('DIV');
    expect(screen.getByTestId('contact-strip')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId('contact-strip')).toHaveAttribute('data-variant', 'split');
    });
    expect(await screen.findByTestId('contact-scene-canvas')).toBeTruthy();
    expect(screen.getByTestId('contact-scene-layout')).toBeTruthy();
    expect(screen.getByTestId('contact-scene-copy')).toContainElement(
      screen.getByTestId('contact-strip'),
    );
    expect(screen.getByTestId('contact-scene-media')).toContainElement(
      screen.getByTestId('contact-scene-canvas'),
    );
  });

  it('wide scene이지만 availableHeight가 800 미만이면 centered ContactStrip만 렌더링해야 한다', async () => {
    mockedUseBreakpoint.mockReturnValue({
      currentBP: 4,
      sceneViewportMode: 'wide',
      viewportHeight: 780,
      viewportWidth: 1280,
    });

    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 780,
      writable: true,
    });

    render(<ContactScene />);

    await waitFor(() => {
      expect(screen.getByTestId('contact-strip')).toHaveAttribute('data-variant', 'centered');
    });

    expect(screen.queryByTestId('contact-scene-canvas')).toBeNull();
    expect(screen.queryByTestId('contact-scene-media')).toBeNull();
    expect(screen.getByTestId('contact-scene-copy')).toContainElement(
      screen.getByTestId('contact-strip'),
    );
  });

  it('app-frame viewport의 동기화된 가용 높이가 짧으면 centered ContactStrip로 전환해야 한다', async () => {
    mockedUseBreakpoint.mockReturnValue({
      currentBP: 4,
      sceneViewportMode: 'wide',
      viewportHeight: 920,
      viewportWidth: 1280,
    });

    const viewport = document.createElement('div');
    viewport.setAttribute('data-app-scroll-viewport', 'true');
    viewport.style.setProperty('--home-hero-available-height', '780px');
    document.body.appendChild(viewport);

    render(<ContactScene />);

    await waitFor(() => {
      expect(screen.getByTestId('contact-strip')).toHaveAttribute('data-variant', 'centered');
    });

    viewport.remove();
  });
});
