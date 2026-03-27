import type { AnimationAction, AnimationClip, AnimationMixer } from 'three';
import { LoopOnce, LoopRepeat } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { CharacterStateMachine } from '@/entities/character/model/character-state-machine';

type FakeAction = Pick<
  AnimationAction,
  | 'clampWhenFinished'
  | 'crossFadeFrom'
  | 'enabled'
  | 'fadeIn'
  | 'fadeOut'
  | 'getClip'
  | 'getMixer'
  | 'getRoot'
  | 'isRunning'
  | 'loop'
  | 'play'
  | 'reset'
  | 'setEffectiveTimeScale'
  | 'setLoop'
  | 'stop'
  | 'time'
>;

/**
 * 상태머신 테스트에서 사용할 최소 AnimationAction 모형을 만듭니다.
 */
const createFakeAction = (duration = 1): FakeAction => ({
  clampWhenFinished: false,
  crossFadeFrom: vi.fn().mockReturnThis(),
  enabled: true,
  fadeIn: vi.fn().mockReturnThis(),
  fadeOut: vi.fn().mockReturnThis(),
  getClip: vi.fn(() => ({ duration }) as AnimationClip),
  getMixer: vi.fn(),
  getRoot: vi.fn(),
  isRunning: vi.fn(),
  loop: LoopOnce,
  play: vi.fn().mockReturnThis(),
  reset: vi.fn().mockReturnThis(),
  setEffectiveTimeScale: vi.fn().mockReturnThis(),
  setLoop: vi.fn().mockImplementation(function setLoop(this: FakeAction, mode) {
    this.loop = mode;
    return this;
  }),
  stop: vi.fn().mockReturnThis(),
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

describe('CharacterStateMachine', () => {
  it('초기 상태를 지정하면 해당 action을 즉시 재생하고 currentState에 기록한다', () => {
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

  it('idle -> typing 전환 시 typing action을 0프레임 LoopOnce로 cross fade 한다', () => {
    const idleAction = createFakeAction(4);
    const typingAction = createFakeAction(2);
    idleAction.time = 3;
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
    expect(typingAction.reset).toHaveBeenCalledOnce();
    expect(typingAction.time).toBe(0);
    expect(typingAction.setLoop).toHaveBeenCalledWith(LoopOnce, 1);
    expect(typingAction.clampWhenFinished).toBe(true);
    expect(typingAction.crossFadeFrom).toHaveBeenCalledWith(idleAction, 0.35, false);
    expect(typingAction.play).toHaveBeenCalledOnce();
  });

  it('typing -> idle 전환 시 idle action은 이전 progress를 이어받아 LoopRepeat로 cross fade 한다', () => {
    const typingAction = createFakeAction(2);
    const idleAction = createFakeAction(4);
    typingAction.time = 1.5;
    const mixer = createFakeMixer({
      idle: idleAction,
      typing: typingAction,
    });

    const machine = new CharacterStateMachine({
      clips: createClips('idle', 'typing'),
      initialState: 'typing',
      mixer,
    });

    machine.transition('idle', 0.2);

    expect(idleAction.time).toBe(3);
    expect(idleAction.setLoop).toHaveBeenCalledWith(LoopRepeat, Infinity);
    expect(idleAction.clampWhenFinished).toBe(false);
    expect(idleAction.crossFadeFrom).toHaveBeenCalledWith(typingAction, 0.2, false);
  });

  it('music 상태는 loop와 함께 더 느린 재생 배속을 적용한다', () => {
    const musicAction = createFakeAction();
    const mixer = createFakeMixer({
      music: musicAction,
    });

    const machine = new CharacterStateMachine({
      clips: createClips('music'),
      initialState: 'music',
      mixer,
    });

    expect(machine.getCurrentState()).toBe('music');
    expect(musicAction.setLoop).toHaveBeenCalledWith(LoopRepeat, Infinity);
    expect(musicAction.setEffectiveTimeScale).toHaveBeenCalledWith(0.4);
  });

  it('이미 같은 상태면 action 설정과 재생을 다시 건드리지 않는다', () => {
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

  it('보조 1회성 clip 재생은 currentState를 바꾸지 않고 LoopOnce만 실행한다', () => {
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

  it('transition listener에는 이전 상태와 다음 상태를 순서대로 전달한다', () => {
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

  it('해제한 transition callback은 이후 전환에서 호출되지 않는다', () => {
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

  it('등록되지 않은 clip 이름은 현재 상태를 유지한 채 무시한다', () => {
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
