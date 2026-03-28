/* @vitest-environment jsdom */

import { act, render } from '@testing-library/react';
import React from 'react';
import { Object3D } from 'three';
import { vi } from 'vitest';

import { OutlineEffect } from '@/features/interaction/ui/outline-effect';

import '@testing-library/jest-dom/vitest';

const selectionMock = { clear: vi.fn(), set: vi.fn() };
const outlineEffectInstanceMock = { dispose: vi.fn(), selection: selectionMock };
const composerInstanceMock = {
  addPass: vi.fn(),
  dispose: vi.fn(),
  render: vi.fn(),
  setSize: vi.fn(),
};
const toneMappingEffectInstanceMock = { kind: 'tone-mapping-effect' };

const postprocessingMock = vi.hoisted(() => ({
  BlendFunction: {
    ALPHA: 'ALPHA',
    SRC: 'SRC',
  },
  EffectComposer: vi.fn(() => composerInstanceMock),
  EffectPass: vi.fn(),
  OutlineEffect: vi.fn(() => outlineEffectInstanceMock),
  RenderPass: vi.fn(),
  ToneMappingEffect: vi.fn(() => toneMappingEffectInstanceMock),
  ToneMappingMode: {
    ACES_FILMIC: 'ACES_FILMIC',
  },
}));

vi.mock('postprocessing', () => ({
  BlendFunction: postprocessingMock.BlendFunction,
  EffectComposer: postprocessingMock.EffectComposer,
  EffectPass: postprocessingMock.EffectPass,
  OutlineEffect: postprocessingMock.OutlineEffect,
  RenderPass: postprocessingMock.RenderPass,
  ToneMappingEffect: postprocessingMock.ToneMappingEffect,
  ToneMappingMode: postprocessingMock.ToneMappingMode,
}));

const fiberMock = vi.hoisted(() => ({
  camera: { kind: 'camera' },
  gl: { render: vi.fn(), toneMapping: 4 },
  scene: { kind: 'scene' },
  size: { height: 600, width: 800 },
}));

vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
  useThree: () => fiberMock,
}));

describe('OutlineEffect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    postprocessingMock.EffectComposer.mockReturnValue(composerInstanceMock);
    postprocessingMock.OutlineEffect.mockReturnValue(outlineEffectInstanceMock);
    postprocessingMock.ToneMappingEffect.mockReturnValue(toneMappingEffectInstanceMock);
    outlineEffectInstanceMock.dispose.mockReset();
    fiberMock.gl.toneMapping = 4;
  });

  it('후처리 outline 경로는 composer와 tone mapping effect를 함께 생성해야 한다', () => {
    render(<OutlineEffect hoveredMeshes={[]} />);

    expect(postprocessingMock.OutlineEffect).toHaveBeenCalledWith(
      fiberMock.scene,
      fiberMock.camera,
      expect.objectContaining({
        edgeStrength: 3,
        blendFunction: 'ALPHA',
        hiddenEdgeColor: 0xffffff,
        visibleEdgeColor: 0xffffff,
        xRay: false,
      }),
    );
    expect(postprocessingMock.ToneMappingEffect).toHaveBeenCalledWith({
      blendFunction: 'SRC',
      mode: 'ACES_FILMIC',
    });
    expect(postprocessingMock.EffectPass).toHaveBeenCalledWith(
      fiberMock.camera,
      outlineEffectInstanceMock,
      toneMappingEffectInstanceMock,
    );
    expect(postprocessingMock.EffectComposer).toHaveBeenCalledWith(fiberMock.gl);
    expect(composerInstanceMock.setSize).toHaveBeenCalledWith(800, 600);
    expect(fiberMock.gl.toneMapping).toBe(0);
  });

  it('hovered mesh가 있으면 selection에 설정해야 한다', async () => {
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

  it('언마운트 시 outline을 먼저 dispose하고 composer를 dispose한 뒤 tone mapping을 복구해야 한다', () => {
    const { unmount } = render(<OutlineEffect hoveredMeshes={[]} />);

    unmount();

    expect(outlineEffectInstanceMock.dispose).toHaveBeenCalled();
    expect(composerInstanceMock.dispose).toHaveBeenCalled();
    expect(fiberMock.gl.toneMapping).toBe(4);
  });
});
