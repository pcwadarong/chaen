import { act, render } from '@testing-library/react';
import React from 'react';
import { Object3D } from 'three';

import { OutlineEffect } from '@/features/interaction/ui/outline-effect';

import '@testing-library/jest-dom/vitest';

const useIsTouchDeviceMock = vi.fn();

vi.mock('@/shared/lib/dom/use-is-touch-device', () => ({
  useIsTouchDevice: () => useIsTouchDeviceMock(),
}));

const selectionMock = { clear: vi.fn(), set: vi.fn() };
const outlineEffectInstanceMock = { selection: selectionMock };
const composerInstanceMock = {
  addPass: vi.fn(),
  dispose: vi.fn(),
  render: vi.fn(),
  setSize: vi.fn(),
};

const postprocessingMock = vi.hoisted(() => ({
  EffectComposer: vi.fn(() => composerInstanceMock),
  EffectPass: vi.fn(),
  OutlineEffect: vi.fn(() => outlineEffectInstanceMock),
  RenderPass: vi.fn(),
}));

vi.mock('postprocessing', () => ({
  EffectComposer: postprocessingMock.EffectComposer,
  EffectPass: postprocessingMock.EffectPass,
  OutlineEffect: postprocessingMock.OutlineEffect,
  RenderPass: postprocessingMock.RenderPass,
}));

const fiberMock = vi.hoisted(() => ({
  camera: { kind: 'camera' },
  gl: { render: vi.fn() },
  scene: { kind: 'scene' },
  size: { height: 600, width: 800 },
}));

vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
  useThree: () => fiberMock,
}));

describe('OutlineEffect', () => {
  beforeEach(() => {
    useIsTouchDeviceMock.mockReturnValue(false);
    vi.clearAllMocks();
    postprocessingMock.EffectComposer.mockReturnValue(composerInstanceMock);
    postprocessingMock.OutlineEffect.mockReturnValue(outlineEffectInstanceMock);
  });

  it('fine pointer 환경에서는 postprocessing 컴포저와 outline effect를 올바른 설정으로 생성해야 한다', () => {
    render(<OutlineEffect hoveredMeshes={[]} />);

    expect(postprocessingMock.OutlineEffect).toHaveBeenCalledWith(
      fiberMock.scene,
      fiberMock.camera,
      expect.objectContaining({
        edgeStrength: 3,
        hiddenEdgeColor: 0xffffff,
        visibleEdgeColor: 0xffffff,
      }),
    );
    expect(postprocessingMock.EffectComposer).toHaveBeenCalledWith(fiberMock.gl);
    expect(composerInstanceMock.setSize).toHaveBeenCalledWith(800, 600);
  });

  it('hovered mesh가 있으면 outline selection에 설정해야 한다', async () => {
    const hoveredMesh = new Object3D();
    hoveredMesh.name = 'bass_body';

    const { rerender } = render(<OutlineEffect hoveredMeshes={[]} />);

    await act(async () => {
      rerender(<OutlineEffect hoveredMeshes={[hoveredMesh]} />);
    });

    expect(selectionMock.set).toHaveBeenCalledWith([hoveredMesh]);
  });

  it('hovered mesh가 없으면 selection을 clear해야 한다', async () => {
    const hoveredMesh = new Object3D();

    const { rerender } = render(<OutlineEffect hoveredMeshes={[hoveredMesh]} />);

    await act(async () => {
      rerender(<OutlineEffect hoveredMeshes={[]} />);
    });

    expect(selectionMock.clear).toHaveBeenCalled();
  });

  it('coarse pointer 환경에서는 컴포저를 생성하지 않아야 한다', () => {
    useIsTouchDeviceMock.mockReturnValue(true);

    render(<OutlineEffect hoveredMeshes={[]} />);

    expect(postprocessingMock.EffectComposer).not.toHaveBeenCalled();
    expect(postprocessingMock.OutlineEffect).not.toHaveBeenCalled();
  });

  it('언마운트 시 컴포저를 dispose해야 한다', () => {
    const { unmount } = render(<OutlineEffect hoveredMeshes={[]} />);

    unmount();

    expect(composerInstanceMock.dispose).toHaveBeenCalled();
  });
});
