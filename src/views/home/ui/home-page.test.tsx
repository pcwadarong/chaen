// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { HomePage } from '@/views/home/ui/home-page';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/widgets/home-hero-scene/ui/home-hero-scene', () => ({
  HomeHeroScene: () => <section data-testid="home-hero-scene" />,
}));

vi.mock('@/widgets/contact-scene', () => ({
  ContactScene: () => <section data-testid="contact-scene" />,
}));

describe('HomePage', () => {
  it('모바일 footer 숨김 마커와 hero/contact section을 함께 렌더링해야 한다', () => {
    const { container } = render(<HomePage items={[]} />);

    expect(container.querySelector('[data-hide-app-frame-footer-mobile="true"]')).toBeTruthy();
    expect(screen.getByTestId('home-hero-scene')).toBeTruthy();
    expect(screen.getByTestId('contact-scene')).toBeTruthy();
  });
});
