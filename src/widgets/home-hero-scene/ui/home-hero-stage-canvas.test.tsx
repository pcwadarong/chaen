import { render, screen } from '@testing-library/react';
import React from 'react';

import { HomeHeroStageCanvas } from '@/widgets/home-hero-scene/ui/home-hero-stage-canvas';

import '@testing-library/jest-dom/vitest';

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="home-hero-stage-canvas">{children}</div>
  ),
}));

vi.mock('@react-three/drei', () => ({
  ContactShadows: () => <div data-testid="contact-shadows" />,
  Float: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  RoundedBox: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/entities/character/ui/character', () => ({
  Character: ({
    instance,
    position,
  }: {
    instance: 'contact' | 'main';
    position: [number, number, number];
  }) => <div data-position={position.join(',')} data-testid={`character-${instance}`} />,
}));

vi.mock('@/widgets/home-hero-scene/ui/use-home-hero-scene-transition', () => ({
  useHomeHeroSceneTransition: () => ({
    cameraMountRef: { current: null },
    pivotRef: { current: null },
  }),
}));

describe('HomeHeroStageCanvas', () => {
  it('홈 전용 stage 내부에 main/contact 캐릭터 인스턴스를 배치한다', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<HomeHeroStageCanvas triggerRef={{ current: null }} webUiRef={{ current: null }} />);

    expect(screen.getByTestId('home-hero-stage-canvas')).toBeTruthy();
    expect(screen.getByTestId('character-main')).toHaveAttribute('data-position', '0,0,0');
    expect(screen.getByTestId('character-contact')).toHaveAttribute('data-position', '0,0,-10');

    consoleErrorSpy.mockRestore();
  });
});
