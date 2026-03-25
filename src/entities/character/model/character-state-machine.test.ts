import type { AnimationAction, AnimationClip, AnimationMixer } from 'three';
import { LoopOnce } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { CharacterStateMachine } from '@/entities/character/model/character-state-machine';

type FakeAction = Pick<
  AnimationAction,
  | 'clampWhenFinished'
  | 'enabled'
  | 'fadeIn'
  | 'fadeOut'
  | 'getMixer'
  | 'getRoot'
  | 'isRunning'
  | 'loop'
  | 'play'
  | 'reset'
  | 'setLoop'
  | 'stop'
>;

/**
 * 상태머신 테스트에서 사용할 최소 AnimationAction 모형을 만듭니다.
 */
const createFakeAction = (): FakeAction => ({
  clampWhenFinished: false,
  enabled: true,
  fadeIn: vi.fn().mockReturnThis(),
  fadeOut: vi.fn().mockReturnThis(),
  getMixer: vi.fn(),
  getRoot: vi.fn(),
  isRunning: vi.fn(),
  loop: LoopOnce,
  play: vi.fn().mockReturnThis(),
  reset: vi.fn().mockReturnThis(),
  setLoop: vi.fn().mockImplementation(function setLoop(this: FakeAction, mode) {
    this.loop = mode;
    return this;
  }),
  stop: vi.fn().mockReturnThis(),
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

describe('CharacterStateMachine', () => {
  it('초기 state action을 재생하고 현재 state를 유지한다', () => {
    const idleAction = createFakeAction();
    const typingAction = createFakeAction();
    const mixer = createFakeMixer({
      idle: idleAction,
      typing: typingAction,
    });

    const machine = new CharacterStateMachine({
      clips: createClips('idle', 'typing'),
      initialState: 'idle',
      mixer,
    });

    expect(machine.getCurrentState()).toBe('idle');
    expect(idleAction.reset).toHaveBeenCalledOnce();
    expect(idleAction.fadeIn).toHaveBeenCalledWith(0);
    expect(idleAction.play).toHaveBeenCalledOnce();
  });

  it('다른 state로 전환하면 이전 action은 fadeOut, 다음 action은 reset/fadeIn/play 한다', () => {
    const idleAction = createFakeAction();
    const typingAction = createFakeAction();
    const mixer = createFakeMixer({
      idle: idleAction,
      typing: typingAction,
    });

    const machine = new CharacterStateMachine({
      clips: createClips('idle', 'typing'),
      initialState: 'idle',
      mixer,
    });

    machine.transition('typing', 0.35);

    expect(machine.getCurrentState()).toBe('typing');
    expect(idleAction.fadeOut).toHaveBeenCalledWith(0.35);
    expect(typingAction.reset).toHaveBeenCalledOnce();
    expect(typingAction.fadeIn).toHaveBeenCalledWith(0.35);
    expect(typingAction.play).toHaveBeenCalledOnce();
  });

  it('같은 state로 전환하면 아무 것도 하지 않는다', () => {
    const idleAction = createFakeAction();
    const mixer = createFakeMixer({
      idle: idleAction,
    });

    const machine = new CharacterStateMachine({
      clips: createClips('idle'),
      initialState: 'idle',
      mixer,
    });

    vi.clearAllMocks();

    machine.transition('idle');

    expect(idleAction.fadeOut).not.toHaveBeenCalled();
    expect(idleAction.fadeIn).not.toHaveBeenCalled();
    expect(idleAction.play).not.toHaveBeenCalled();
  });

  it('play는 현재 state를 유지한 채 1회 재생 action만 실행한다', () => {
    const idleAction = createFakeAction();
    const notificationAction = createFakeAction();
    const mixer = createFakeMixer({
      idle: idleAction,
      notification: notificationAction,
    });

    const machine = new CharacterStateMachine({
      clips: createClips('idle', 'notification'),
      initialState: 'idle',
      mixer,
    });

    machine.play('notification');

    expect(machine.getCurrentState()).toBe('idle');
    expect(notificationAction.reset).toHaveBeenCalledOnce();
    expect(notificationAction.setLoop).toHaveBeenCalledWith(LoopOnce, 1);
    expect(notificationAction.clampWhenFinished).toBe(true);
    expect(notificationAction.play).toHaveBeenCalledOnce();
  });

  it('transition callback은 from/to를 전달한다', () => {
    const idleAction = createFakeAction();
    const typingAction = createFakeAction();
    const mixer = createFakeMixer({
      idle: idleAction,
      typing: typingAction,
    });

    const machine = new CharacterStateMachine({
      clips: createClips('idle', 'typing'),
      initialState: 'idle',
      mixer,
    });
    const listener = vi.fn();

    machine.onTransition(listener);
    machine.transition('typing');

    expect(listener).toHaveBeenCalledWith('idle', 'typing');
  });

  it('해제한 transition callback은 더 이상 호출되지 않는다', () => {
    const idleAction = createFakeAction();
    const typingAction = createFakeAction();
    const mixer = createFakeMixer({
      idle: idleAction,
      typing: typingAction,
    });

    const machine = new CharacterStateMachine({
      clips: createClips('idle', 'typing'),
      initialState: 'idle',
      mixer,
    });
    const listener = vi.fn();

    machine.onTransition(listener);
    machine.offTransition(listener);
    machine.transition('typing');

    expect(listener).not.toHaveBeenCalled();
  });

  it('없는 clip 이름은 무시한다', () => {
    const idleAction = createFakeAction();
    const mixer = createFakeMixer({
      idle: idleAction,
    });

    const machine = new CharacterStateMachine({
      clips: createClips('idle'),
      initialState: 'idle',
      mixer,
    });

    machine.transition('typing');
    machine.play('notification');

    expect(machine.getCurrentState()).toBe('idle');
    expect(idleAction.fadeOut).not.toHaveBeenCalled();
  });
});
