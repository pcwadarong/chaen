import { act, renderHook } from '@testing-library/react';
import type { AnimationAction, AnimationClip, AnimationMixer } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { useCharacterState } from '@/features/character/model/use-character-state';

type FakeAction = Pick<AnimationAction, 'fadeIn' | 'fadeOut' | 'play' | 'reset'>;

/**
 * 훅 테스트에서 사용할 최소 AnimationAction 모형을 만듭니다.
 */
const createFakeAction = (): FakeAction => ({
  fadeIn: vi.fn().mockReturnThis(),
  fadeOut: vi.fn().mockReturnThis(),
  play: vi.fn().mockReturnThis(),
  reset: vi.fn().mockReturnThis(),
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
  it('main 인스턴스는 idle로 시작하고 다른 상태로 전환할 수 있다', () => {
    const idleAction = createFakeAction();
    const typingAction = createFakeAction();
    const clips = createClips('idle', 'typing');
    const mixer = createFakeMixer({
      idle: idleAction,
      typing: typingAction,
    });

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
    expect(idleAction.fadeOut).toHaveBeenCalledWith(0.12);
    expect(typingAction.fadeIn).toHaveBeenCalledWith(0.12);
    expect(typingAction.play).toHaveBeenCalledOnce();
    expect(idleAction.play).toHaveBeenCalledOnce();
  });

  it('contact 인스턴스는 music으로 시작하고 전환 요청을 무시한다', () => {
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
