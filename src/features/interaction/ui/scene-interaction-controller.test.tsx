/* @vitest-environment jsdom */

import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { Object3D } from 'three';
import { vi } from 'vitest';

import { SceneInteractionController } from '@/features/interaction/ui/scene-interaction-controller';

import '@testing-library/jest-dom/vitest';

const raycasterMockState = vi.hoisted(() => ({
  clearHoveredMesh: vi.fn(),
  hoveredOutlineMeshes: [] as Object3D[],
  onPointerClick: vi.fn(),
  onPointerMove: vi.fn(),
  setHoveredMeshDirect: vi.fn(),
}));

const interactionActionsMockState = vi.hoisted(() => ({
  handleMeshClick: vi.fn(),
}));

const keyboardTargets = {
  bass: Object.assign(new Object3D(), { name: 'bass_body' }),
  camera: Object.assign(new Object3D(), { name: 'camera' }),
  laptop: Object.assign(new Object3D(), { name: 'laptop' }),
};

const canvasElement = document.createElement('canvas');

vi.mock('@react-three/fiber', () => ({
  useThree: () => ({
    gl: { domElement: canvasElement },
    scene: {
      getObjectByName: (name: string) => {
        if (name === 'laptop') return keyboardTargets.laptop;
        if (name === 'bass_body') return keyboardTargets.bass;
        if (name === 'camera') return keyboardTargets.camera;

        return undefined;
      },
    },
  }),
}));

vi.mock('@/features/interaction/model/useRaycaster', () => ({
  useRaycaster: () => raycasterMockState,
}));

vi.mock('@/features/interaction/model/useInteractionActions', () => ({
  useInteractionActions: () => interactionActionsMockState,
}));

vi.mock('@/features/interaction/ui/outline-effect', () => ({
  OutlineEffect: () => <div data-testid="outline-effect" />,
}));

describe('SceneInteractionController', () => {
  beforeEach(() => {
    document.body.append(canvasElement);
    raycasterMockState.clearHoveredMesh.mockReset();
    raycasterMockState.onPointerClick.mockReset();
    raycasterMockState.onPointerMove.mockReset();
    raycasterMockState.setHoveredMeshDirect.mockReset();
    interactionActionsMockState.handleMeshClick.mockReset();
    canvasElement.removeAttribute('aria-label');
    canvasElement.tabIndex = -1;
  });

  afterEach(() => {
    canvasElement.remove();
  });

  it('canvas에 포커스가 들어올 때, SceneInteractionController는 첫 keyboard target을 hover 상태로 설정해야 한다', () => {
    render(<SceneInteractionController onBrowseProjects={vi.fn()} onOpenImageViewer={vi.fn()} />);

    fireEvent.focus(canvasElement);

    expect(canvasElement).toHaveAttribute('aria-label', '홈 씬 상호작용 캔버스');
    expect(canvasElement.tabIndex).toBe(0);
    expect(raycasterMockState.setHoveredMeshDirect).toHaveBeenCalledWith(keyboardTargets.laptop);
  });

  it('화살표 키와 Enter 입력이 들어올 때, SceneInteractionController는 keyboard target을 순환하고 현재 타겟 click을 실행해야 한다', () => {
    render(<SceneInteractionController onBrowseProjects={vi.fn()} onOpenImageViewer={vi.fn()} />);

    fireEvent.focus(canvasElement);
    fireEvent.keyDown(canvasElement, { key: 'ArrowRight' });
    fireEvent.keyDown(canvasElement, { key: 'Enter' });

    expect(raycasterMockState.setHoveredMeshDirect).toHaveBeenCalledWith(keyboardTargets.bass);
    expect(interactionActionsMockState.handleMeshClick).toHaveBeenCalledWith(keyboardTargets.bass);
  });

  it('blur가 발생할 때, SceneInteractionController는 hover 상태를 해제해야 한다', () => {
    render(<SceneInteractionController onBrowseProjects={vi.fn()} onOpenImageViewer={vi.fn()} />);

    fireEvent.blur(canvasElement);

    expect(raycasterMockState.clearHoveredMesh).toHaveBeenCalledOnce();
  });
});
