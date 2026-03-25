import { act, renderHook } from '@testing-library/react';
import { gsap } from 'gsap';
import { Mesh } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CharacterAnimState } from '@/features/character/model/use-character-state';
import { useShapeKeyController } from '@/features/character/model/use-shape-key-controller';

vi.mock('gsap', () => ({
  gsap: {
    killTweensOf: vi.fn(),
    to: vi.fn(),
  },
}));

type MorphMesh = Mesh & {
  morphTargetDictionary: Record<string, number>;
  morphTargetInfluences: number[];
};

/**
 * 테스트용 morph target mesh를 생성합니다.
 */
const createMorphMesh = (dictionary: Record<string, number>): MorphMesh => {
  const mesh = new Mesh() as MorphMesh;

  mesh.morphTargetDictionary = dictionary;
  mesh.morphTargetInfluences = Array(Object.keys(dictionary).length).fill(0);

  return mesh;
};

describe('useShapeKeyController', () => {
  beforeEach(() => {
    vi.mocked(gsap.to).mockImplementation((target, vars) => {
      Object.entries(vars).forEach(([key, value]) => {
        if (key === 'duration' || key === 'ease' || key === 'onUpdate') return;
        Reflect.set(target as object, key, value);
      });

      if (typeof vars.onUpdate === 'function') {
        vars.onUpdate();
      }

      return { kill: vi.fn() } as never;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('typing 상태에서 head와 eyebrow morph를 목표값으로 전환한다', () => {
    const browMesh = createMorphMesh({
      up: 0,
      down: 1,
    });
    const headMesh = createMorphMesh({
      eye_close: 0,
      mouth_curious: 1,
      mouth_smile: 2,
    });
    const eyebrowMesh = createMorphMesh({
      eye_close: 0,
    });

    const { result } = renderHook(() =>
      useShapeKeyController({
        browMesh,
        currentState: 'typing',
        eyebrowMesh,
        headMesh,
      }),
    );

    expect(result.current.browMorphs.down).toBe(1);
    expect(result.current.browMorphs.up).toBe(0);
    expect(browMesh.morphTargetInfluences).toEqual([0, 1]);
    expect(result.current.headMorphs.eye_close).toBe(0.5);
    expect(result.current.headMorphs.mouth_curious).toBe(1);
    expect(result.current.headMorphs.mouth_smile).toBe(0);
    expect(headMesh.morphTargetInfluences).toEqual([0.5, 1, 0]);
    expect(result.current.eyebrowMorphs.eye_close).toBe(0.5);
    expect(eyebrowMesh.morphTargetInfluences[0]).toBe(0.5);
  });

  it('notification과 music 상태에서 표정 목표값을 다르게 적용한다', () => {
    const browMesh = createMorphMesh({
      up: 0,
      down: 1,
    });
    const headMesh = createMorphMesh({
      eye_close: 0,
      mouth_curious: 1,
      mouth_smile: 2,
    });
    const eyebrowMesh = createMorphMesh({
      eye_close: 0,
    });

    const { rerender } = renderHook(
      ({ currentState }) =>
        useShapeKeyController({
          browMesh,
          currentState,
          eyebrowMesh,
          headMesh,
        }),
      {
        initialProps: {
          currentState: 'notification' as CharacterAnimState,
        },
      },
    );

    expect(headMesh.morphTargetInfluences).toEqual([0, 0, 1]);
    expect(browMesh.morphTargetInfluences).toEqual([1, 0]);
    expect(eyebrowMesh.morphTargetInfluences).toEqual([0]);

    rerender({ currentState: 'music' });

    expect(headMesh.morphTargetInfluences).toEqual([1, 0, 1]);
    expect(browMesh.morphTargetInfluences).toEqual([1, 0]);
    expect(eyebrowMesh.morphTargetInfluences[0]).toBe(1);
  });

  it('setMorph는 지정한 mesh key만 직접 갱신한다', () => {
    const browMesh = createMorphMesh({
      up: 0,
      down: 1,
    });
    const headMesh = createMorphMesh({
      eye_close: 0,
      mouth_curious: 1,
      mouth_smile: 2,
    });
    const eyebrowMesh = createMorphMesh({
      eye_close: 0,
    });

    const { result } = renderHook(() =>
      useShapeKeyController({
        browMesh,
        currentState: 'idle',
        eyebrowMesh,
        headMesh,
      }),
    );

    act(() => {
      result.current.setMorph(headMesh, 'mouth_smile', 0.75);
    });

    expect(result.current.headMorphs.mouth_smile).toBe(0.75);
    expect(headMesh.morphTargetInfluences[2]).toBe(0.75);

    act(() => {
      result.current.setMorph(browMesh, 'up', 1);
    });

    expect(result.current.browMorphs.up).toBe(1);
    expect(browMesh.morphTargetInfluences[0]).toBe(1);

    act(() => {
      result.current.setMorph(eyebrowMesh, 'unknown', 1);
    });

    expect(eyebrowMesh.morphTargetInfluences).toEqual([0]);
  });
});
