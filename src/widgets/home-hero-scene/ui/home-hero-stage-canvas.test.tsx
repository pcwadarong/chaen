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
  OrbitControls: () => <div data-testid="orbit-controls" />,
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

vi.mock('@/entities/scene/ui/scene-prop', () => ({
  SceneProp: ({ path, position }: { path: string; position: [number, number, number] }) => (
    <div data-path={path} data-position={position.join(',')} data-testid={`prop-${path}`} />
  ),
}));

vi.mock('@/widgets/home-hero-scene/ui/use-home-hero-scene-transition', () => ({
  useHomeHeroSceneTransition: () => ({
    cameraMountRef: { current: null },
    isScrollDriven: false,
    pivotRef: { current: null },
  }),
}));

describe('HomeHeroStageCanvas', () => {
  it('홈 전용 stage 내부에 main 캐릭터와 소품을 배치하고 orbit controls를 렌더링한다', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<HomeHeroStageCanvas triggerRef={{ current: null }} webUiRef={{ current: null }} />);

    expect(screen.getByTestId('home-hero-stage-canvas')).toBeTruthy();
    expect(screen.getByTestId('orbit-controls')).toBeTruthy();
    expect(screen.getByTestId('character-main')).toHaveAttribute('data-position', '0,0,0');
    expect(screen.queryByTestId('character-contact')).toBeNull();
    expect(screen.getByTestId('prop-/models/sofa.glb')).toHaveAttribute('data-position', '0,0,-2');
    expect(screen.getByTestId('prop-/models/guitar.glb')).toHaveAttribute(
      'data-position',
      '-1,0,0.4',
    );
    expect(screen.getByTestId('prop-/models/table.glb')).toHaveAttribute(
      'data-position',
      '1,0,0.25',
    );

    consoleErrorSpy.mockRestore();
  });
});
