import { render, screen } from '@testing-library/react';
import React from 'react';

import { HomeHeroScene } from '@/widgets/home-hero-scene/ui/home-hero-scene';

const translationMessages = {
  eyebrow: 'Frontend Engineer',
  title: 'Stage Driven Portfolio',
  description: 'Scroll to move into the monitor and continue into projects.',
} as const;

vi.mock('next-intl', () => ({
  useTranslations: () => (key: keyof typeof translationMessages) => translationMessages[key],
}));

vi.mock('@/widgets/home-hero-scene/ui/home-hero-stage', () => ({
  HomeHeroStage: () => <div data-testid="home-hero-stage" />,
}));

describe('HomeHeroScene', () => {
  it('오버레이 텍스트와 스테이지를 함께 렌더링한다', () => {
    render(<HomeHeroScene />);

    expect(screen.getByText('Frontend Engineer')).toBeTruthy();
    expect(screen.getByText('Stage Driven Portfolio')).toBeTruthy();
    expect(
      screen.getByText('Scroll to move into the monitor and continue into projects.'),
    ).toBeTruthy();
    expect(screen.getByTestId('home-hero-stage')).toBeTruthy();
  });
});
