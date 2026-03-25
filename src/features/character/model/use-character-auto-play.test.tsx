import { renderHook } from '@testing-library/react';
import { AnimationClip } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCharacterAutoPlay } from '@/features/character/model/use-character-auto-play';
import type { CharacterAnimState } from '@/features/character/model/use-character-state';

const createClip = (name: CharacterAnimState, duration: number) =>
  new AnimationClip(name, duration, []);

describe('useCharacterAutoPlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  it('main 인스턴스는 idle 이후 typing으로 전환한다', () => {
    const transitionTo = vi.fn();

    renderHook(() =>
      useCharacterAutoPlay({
        clips: [createClip('typing', 1.2), createClip('notification', 0.8)],
        currentState: 'idle',
        instance: 'main',
        transitionTo,
      }),
    );

    vi.advanceTimersByTime(3199);
    expect(transitionTo).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(transitionTo).toHaveBeenCalledWith('typing');
  });

  it('typing 이후에는 idle로 돌아가고, 다음 idle은 notification을 예약한다', () => {
    const transitionTo = vi.fn();
    const clips = [createClip('typing', 1.5), createClip('notification', 0.9)];

    const { rerender } = renderHook(
      ({ currentState }) =>
        useCharacterAutoPlay({
          clips,
          currentState,
          instance: 'main',
          transitionTo,
        }),
      {
        initialProps: {
          currentState: 'typing' as CharacterAnimState,
        },
      },
    );

    vi.advanceTimersByTime(1499);
    expect(transitionTo).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(transitionTo).toHaveBeenLastCalledWith('idle');

    rerender({
      currentState: 'idle',
    });

    vi.advanceTimersByTime(3199);
    expect(transitionTo).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    expect(transitionTo).toHaveBeenLastCalledWith('notification');

    rerender({
      currentState: 'notification',
    });

    vi.advanceTimersByTime(899);
    expect(transitionTo).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(1);
    expect(transitionTo).toHaveBeenLastCalledWith('idle');
  });

  it('contact 인스턴스는 자동 상태 순환을 시작하지 않는다', () => {
    const transitionTo = vi.fn();

    renderHook(() =>
      useCharacterAutoPlay({
        clips: [createClip('typing', 1.2), createClip('notification', 0.8)],
        currentState: 'idle',
        instance: 'contact',
        transitionTo,
      }),
    );

    vi.advanceTimersByTime(10000);
    expect(transitionTo).not.toHaveBeenCalled();
  });
});
