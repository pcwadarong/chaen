import { act, renderHook } from '@testing-library/react';
import { gsap } from 'gsap';
import { Mesh } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CharacterAnimState } from '@/entities/character/model/character-animation-state';
import { useBlinkAnimation } from '@/features/character-animation/model/use-blink-animation';

vi.mock('gsap', () => ({
  gsap: {
    killTweensOf: vi.fn(),
    timeline: vi.fn(),
  },
}));

type MorphMesh = Mesh & {
  morphTargetDictionary: Record<string, number>;
  morphTargetInfluences: number[];
};

/**
 * 테스트용 morph mesh를 생성합니다.
 */
const createMorphMesh = (dictionary: Record<string, number>): MorphMesh => {
  const mesh = new Mesh() as MorphMesh;

  mesh.morphTargetDictionary = dictionary;
  mesh.morphTargetInfluences = Array(Object.keys(dictionary).length).fill(0);

  return mesh;
};

/**
 * gsap timeline mock을 구성합니다.
 */
const createTimelineMock = () => {
  const timeline = {
    kill: vi.fn(),
    to: vi.fn((target: Record<string, number>, vars: Record<string, unknown>) => {
      Object.entries(vars).forEach(([key, value]) => {
        if (key === 'duration' || key === 'onUpdate') return;
        if (typeof value === 'number') {
          target[key] = value;
        }
      });

      const onUpdate = vars.onUpdate;
      if (typeof onUpdate === 'function') onUpdate();

      return timeline;
    }),
  };

  return timeline;
};

describe('useBlinkAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.mocked(gsap.timeline).mockImplementation(() => createTimelineMock() as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('idle에서는 base delay 이후 blink timeline을 시작하고 종료 시 eye_close를 0으로 돌린다', () => {
    const headMesh = createMorphMesh({ eye_close: 0 });
    const eyebrowMesh = createMorphMesh({ eye_close: 0 });

    renderHook(() =>
      useBlinkAnimation({
        currentState: 'idle',
        eyebrowMesh,
        headMesh,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(gsap.timeline).toHaveBeenCalledOnce();
    expect(headMesh.morphTargetInfluences[0]).toBe(0);
    expect(eyebrowMesh.morphTargetInfluences[0]).toBe(0);
  });

  it('idle을 벗어나면 예약된 blink를 취소하고 eye_close를 0으로 되돌린다', () => {
    const headMesh = createMorphMesh({ eye_close: 0 });
    const eyebrowMesh = createMorphMesh({ eye_close: 0 });

    const { rerender } = renderHook(
      ({ currentState }) =>
        useBlinkAnimation({
          currentState,
          eyebrowMesh,
          headMesh,
        }),
      {
        initialProps: {
          currentState: 'idle' as CharacterAnimState,
        },
      },
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    headMesh.morphTargetInfluences[0] = 0.8;
    eyebrowMesh.morphTargetInfluences[0] = 0.8;

    rerender({ currentState: 'typing' });

    expect(headMesh.morphTargetInfluences[0]).toBe(0);
    expect(eyebrowMesh.morphTargetInfluences[0]).toBe(0);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(gsap.timeline).not.toHaveBeenCalled();
  });
});
