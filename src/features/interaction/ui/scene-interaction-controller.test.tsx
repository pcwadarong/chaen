/* @vitest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react';
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

const isTouchDeviceMock = vi.fn(() => false);

vi.mock('@/shared/lib/dom/use-is-touch-device', () => ({
  useIsTouchDevice: () => isTouchDeviceMock(),
}));

const outlineEffectMockState = vi.hoisted(() => ({
  hoveredMeshes: [] as Object3D[],
}));

vi.mock('@/features/interaction/ui/outline-effect', () => ({
  OutlineEffect: (props: { hoveredMeshes: Object3D[] }) => {
    outlineEffectMockState.hoveredMeshes = props.hoveredMeshes;

    return <div data-testid="outline-effect" />;
  },
}));

describe('SceneInteractionController', () => {
  beforeEach(() => {
    document.body.append(canvasElement);
    isTouchDeviceMock.mockReturnValue(false);
    raycasterMockState.clearHoveredMesh.mockReset();
    raycasterMockState.hoveredOutlineMeshes = [];
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

  it('fine pointer 환경에서 outline이 허용되면, SceneInteractionController는 outline effect를 렌더해야 한다', () => {
    render(<SceneInteractionController onBrowseProjects={vi.fn()} onOpenImageViewer={vi.fn()} />);

    expect(screen.getByTestId('outline-effect')).toBeTruthy();
    expect(outlineEffectMockState.hoveredMeshes).toHaveLength(0);
  });

  it('showOutlineEffect가 false일 때, SceneInteractionController는 outline effect를 렌더하지 않아야 한다', () => {
    render(
      <SceneInteractionController
        onBrowseProjects={vi.fn()}
        onOpenImageViewer={vi.fn()}
        showOutlineEffect={false}
      />,
    );

    expect(screen.queryByTestId('outline-effect')).toBeNull();
  });

  it('coarse pointer 환경일 때, SceneInteractionController는 outline effect를 렌더하지 않아야 한다', () => {
    isTouchDeviceMock.mockReturnValue(true);

    render(<SceneInteractionController onBrowseProjects={vi.fn()} onOpenImageViewer={vi.fn()} />);

    expect(screen.queryByTestId('outline-effect')).toBeNull();
  });

  it('hovered outline mesh가 있으면 outline effect에 전달해야 한다', () => {
    raycasterMockState.hoveredOutlineMeshes = [keyboardTargets.bass];

    render(<SceneInteractionController onBrowseProjects={vi.fn()} onOpenImageViewer={vi.fn()} />);

    expect(outlineEffectMockState.hoveredMeshes).toContain(keyboardTargets.bass);
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
