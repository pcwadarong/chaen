import { render, screen } from '@testing-library/react';
import React from 'react';

import { ContactScene } from '@/widgets/contact-scene/ui/contact-scene';
import { useBreakpoint } from '@/widgets/home-hero-scene/model/use-breakpoint';

vi.mock('next/dynamic', () => ({
  default: () => {
    const DynamicComponent = () => <div data-testid="contact-scene-canvas" />;

    return DynamicComponent;
  },
}));

vi.mock('@/widgets/contact-strip/ui/contact-strip', () => ({
  ContactStrip: () => <section data-testid="contact-strip" />,
}));

vi.mock('@/widgets/home-hero-scene/model/use-breakpoint', () => ({
  useBreakpoint: vi.fn(),
}));

const mockedUseBreakpoint = vi.mocked(useBreakpoint);

describe('ContactScene', () => {
  it('모바일에서는 동일한 wrapper 안에 ContactStrip만 렌더링해야 한다', () => {
    mockedUseBreakpoint.mockReturnValue({
      currentBP: 2,
      sceneMode: 'mobile',
    });

    const { container } = render(<ContactScene />);

    expect(container.firstElementChild?.tagName).toBe('DIV');
    expect(screen.getByTestId('contact-strip')).toBeTruthy();
    expect(screen.queryByTestId('contact-scene-canvas')).toBeNull();
  });

  it('데스크탑에서는 동일한 wrapper 안에 캔버스와 ContactStrip을 함께 렌더링해야 한다', () => {
    mockedUseBreakpoint.mockReturnValue({
      currentBP: 4,
      sceneMode: 'desktop',
    });

    const { container } = render(<ContactScene />);

    expect(container.firstElementChild?.tagName).toBe('DIV');
    expect(screen.getByTestId('contact-strip')).toBeTruthy();
    expect(screen.getByTestId('contact-scene-canvas')).toBeTruthy();
  });
});
