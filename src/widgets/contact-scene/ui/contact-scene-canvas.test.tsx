// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { ContactSceneCanvas } from '@/widgets/contact-scene/ui/contact-scene-canvas';

import '@testing-library/jest-dom/vitest';

const contactSceneCanvasMockState = vi.hoisted(() => ({
  camera: {
    lookAt: vi.fn(),
    position: {
      set: vi.fn(),
    },
    updateMatrixWorld: vi.fn(),
  },
  canvasCameraProps: null as null | Record<string, unknown>,
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: ({
    camera,
    children,
  }: {
    camera?: Record<string, unknown>;
    children: React.ReactNode;
  }) => {
    contactSceneCanvasMockState.canvasCameraProps = camera ?? null;

    return <div data-testid="contact-scene-canvas">{children}</div>;
  },
  useThree: () => ({
    camera: contactSceneCanvasMockState.camera,
  }),
}));

vi.mock('@/widgets/home-hero-scene/ui/home-hero-scene-primitives', () => ({
  HomeHeroCharacterSeatSet: ({ instance }: { instance: 'contact' | 'main' }) => (
    <div data-testid={`character-seat-set-${instance}`} />
  ),
  HomeHeroStageLights: () => <div data-testid="stage-lights" />,
}));

describe('ContactSceneCanvas', () => {
  beforeEach(() => {
    contactSceneCanvasMockState.canvasCameraProps = null;
    contactSceneCanvasMockState.camera.lookAt.mockReset();
    contactSceneCanvasMockState.camera.position.set.mockReset();
    contactSceneCanvasMockState.camera.updateMatrixWorld.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('desktop large에서는 중앙 타깃을 유지한 채 contact 캐릭터 씬을 렌더링해야 한다', () => {
    render(<ContactSceneCanvas />);

    expect(screen.getByTestId('contact-scene-canvas')).toBeTruthy();
    expect(screen.getByTestId('stage-lights')).toBeTruthy();
    expect(screen.getByTestId('character-seat-set-contact')).toBeTruthy();
    expect(contactSceneCanvasMockState.canvasCameraProps).toMatchObject({
      fov: 42,
      position: [0, 1, 10],
    });
    expect(contactSceneCanvasMockState.camera.position.set).toHaveBeenCalledWith(0, 1, 10);
    expect(contactSceneCanvasMockState.camera.lookAt).toHaveBeenCalledWith(0, 0, 0);
    expect(contactSceneCanvasMockState.camera.updateMatrixWorld).toHaveBeenCalled();
  });
});
