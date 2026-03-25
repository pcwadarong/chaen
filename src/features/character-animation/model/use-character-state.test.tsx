import { act, renderHook } from '@testing-library/react';
import type { AnimationAction, AnimationClip, AnimationMixer } from 'three';
import { LoopOnce } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { useCharacterState } from '@/features/character-animation/model/use-character-state';

type FakeAction = Pick<
  AnimationAction,
  | 'clampWhenFinished'
  | 'crossFadeFrom'
  | 'fadeIn'
  | 'fadeOut'
  | 'getClip'
  | 'play'
  | 'reset'
  | 'setLoop'
  | 'time'
>;

/**
 * 훅 테스트에서 사용할 최소 AnimationAction 모형을 만듭니다.
 */
const createFakeAction = (duration = 1): FakeAction => ({
  clampWhenFinished: false,
  crossFadeFrom: vi.fn().mockReturnThis(),
  fadeIn: vi.fn().mockReturnThis(),
  fadeOut: vi.fn().mockReturnThis(),
  getClip: vi.fn(() => ({ duration }) as AnimationClip),
  play: vi.fn().mockReturnThis(),
  reset: vi.fn().mockReturnThis(),
  setLoop: vi.fn().mockImplementation(function setLoop() {
    return this;
  }),
  time: 0,
});

/**
 * clip 이름별 fake action을 돌려주는 최소 mixer 모형을 만듭니다.
 */
const createFakeMixer = (actions: Record<string, FakeAction>) =>
  ({
    clipAction: vi.fn((clip: AnimationClip) => actions[clip.name]),
  }) as unknown as AnimationMixer;

/**
 * 테스트용 AnimationClip 배열을 만듭니다.
 */
const createClips = (...names: string[]): AnimationClip[] =>
  names.map(name => ({ name }) as AnimationClip);

describe('useCharacterState', () => {
  it('main 인스턴스의 idle -> typing 전환은 typing action을 0프레임 LoopOnce로 시작한다', () => {
    const idleAction = createFakeAction(4);
    const typingAction = createFakeAction(2);
    const clips = createClips('idle', 'typing');
    const mixer = createFakeMixer({
      idle: idleAction,
      typing: typingAction,
    });
    idleAction.time = 3;

    const { result } = renderHook(() =>
      useCharacterState({
        clips,
        instance: 'main',
        mixer,
      }),
    );

    expect(result.current.currentState).toBe('idle');

    act(() => {
      result.current.transitionTo('typing');
    });

    expect(result.current.currentState).toBe('typing');
    expect(typingAction.time).toBe(0);
    expect(typingAction.setLoop).toHaveBeenCalledWith(LoopOnce, 1);
    expect(typingAction.clampWhenFinished).toBe(true);
    expect(typingAction.crossFadeFrom).toHaveBeenCalledWith(idleAction, 0.12, false);
    expect(typingAction.play).toHaveBeenCalledOnce();
    expect(idleAction.play).toHaveBeenCalledOnce();
  });

  it('contact 인스턴스는 music 고정이라 transitionTo 호출을 무시한다', () => {
    const musicAction = createFakeAction();
    const typingAction = createFakeAction();
    const clips = createClips('music', 'typing');
    const mixer = createFakeMixer({
      music: musicAction,
      typing: typingAction,
    });

    const { result } = renderHook(() =>
      useCharacterState({
        clips,
        instance: 'contact',
        mixer,
      }),
    );

    expect(result.current.currentState).toBe('music');

    act(() => {
      result.current.transitionTo('typing');
    });

    expect(result.current.currentState).toBe('music');
    expect(musicAction.play).toHaveBeenCalledOnce();
    expect(typingAction.play).not.toHaveBeenCalled();
  });
});
