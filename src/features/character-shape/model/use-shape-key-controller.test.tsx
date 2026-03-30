import { act, renderHook } from '@testing-library/react';
import { gsap } from 'gsap';
import { Mesh } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CharacterAnimState } from '@/entities/character/model/character-animation-state';
import type { CharacterClipDurations } from '@/entities/character/model/character-clip-durations';
import { useShapeKeyController } from '@/features/character-shape/model/use-shape-key-controller';

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

const clipDurations: CharacterClipDurations = {
  idle: 2500,
  music: 2500,
  notification: 2500,
  typing: 2500,
};

describe('useShapeKeyController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
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
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('typing 진입 시 morph를 목표값으로 맞추고 종료 0.5초 전에 release를 예약한다', () => {
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
        clipDurations,
        currentState: 'typing',
        eyebrowMesh,
        headMesh,
      }),
    );

    expect(result.current.browMorphs.down).toBe(1);
    expect(result.current.browMorphs.up).toBe(0);
    expect(browMesh.morphTargetInfluences).toEqual([0, 1]);
    expect(result.current.headMorphs.eye_close).toBe(0.3);
    expect(result.current.headMorphs.mouth_curious).toBe(1);
    expect(result.current.headMorphs.mouth_smile).toBe(0);
    expect(headMesh.morphTargetInfluences).toEqual([0.3, 1, 0]);
    expect(result.current.eyebrowMorphs.eye_close).toBe(0.3);
    expect(eyebrowMesh.morphTargetInfluences[0]).toBe(0.3);

    act(() => {
      vi.advanceTimersByTime(1759);
    });

    expect(result.current.headMorphs.mouth_curious).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.browMorphs.down).toBe(0);
    expect(result.current.headMorphs.eye_close).toBe(0);
    expect(result.current.headMorphs.mouth_curious).toBe(0);
    expect(result.current.eyebrowMorphs.eye_close).toBe(0);
  });

  it('notification 진입은 0.85초로 올리고 notification -> idle은 0.6초로 release 한다', () => {
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
          clipDurations,
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
    expect(vi.mocked(gsap.to).mock.calls[0]?.[1]).toMatchObject({ duration: 0.85 });

    rerender({ currentState: 'idle' });

    expect(vi.mocked(gsap.to).mock.calls.slice(-3)).toEqual(
      expect.arrayContaining([
        [expect.anything(), expect.objectContaining({ duration: 0.6 })],
        [expect.anything(), expect.objectContaining({ duration: 0.6 })],
        [expect.anything(), expect.objectContaining({ duration: 0.6 })],
      ]),
    );

    rerender({ currentState: 'music' });

    expect(headMesh.morphTargetInfluences).toEqual([1, 0, 1]);
    expect(eyebrowMesh.morphTargetInfluences[0]).toBe(1);
  });

  it('setMorph는 넘겨받은 mesh와 key에 해당하는 morph influence만 직접 갱신한다', () => {
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
        clipDurations,
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
