import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

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
  ContactStrip: ({ variant }: { variant?: string }) => (
    <section data-testid="contact-strip" data-variant={variant ?? 'desktop'} />
  ),
}));

vi.mock('@/widgets/home-hero-scene/model/use-breakpoint', () => ({
  useBreakpoint: vi.fn(),
}));

const mockedUseBreakpoint = vi.mocked(useBreakpoint);

describe('ContactScene', () => {
  it('모바일에서는 contact scene 자체를 렌더링하지 않아야 한다', () => {
    mockedUseBreakpoint.mockReturnValue({
      currentBP: 2,
      sceneMode: 'mobile',
    });

    const { container } = render(<ContactScene />);

    expect(container.firstElementChild).toBeNull();
    expect(screen.queryByTestId('contact-scene-canvas')).toBeNull();
    expect(screen.queryByTestId('contact-strip')).toBeNull();
  });

  it('데스크탑에서는 mount 이후 canvas와 desktop ContactStrip을 함께 렌더링해야 한다', async () => {
    mockedUseBreakpoint.mockReturnValue({
      currentBP: 4,
      sceneMode: 'desktop',
    });

    const { container } = render(<ContactScene />);

    expect(container.firstElementChild?.tagName).toBe('DIV');
    expect(screen.getByTestId('contact-strip')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId('contact-strip')).toHaveAttribute('data-variant', 'desktop');
    });
    expect(await screen.findByTestId('contact-scene-canvas')).toBeTruthy();
  });
});
