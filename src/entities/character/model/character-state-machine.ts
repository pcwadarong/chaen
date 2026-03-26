import type { AnimationAction, AnimationClip, AnimationMixer } from 'three';
import { LoopOnce, LoopRepeat } from 'three';

import {
  type CharacterAnimState,
  isLoopingCharacterAnimState,
} from '@/entities/character/model/character-animation-state';

type CharacterStateMachineOptions = Readonly<{
  clips: AnimationClip[];
  initialState?: CharacterAnimState;
  mixer: AnimationMixer;
}>;

type TransitionListener = (from: CharacterAnimState | null, to: CharacterAnimState) => void;

/**
 * 캐릭터 애니메이션 clip을 상태 단위로 전환하는 경량 상태머신입니다.
 */
export class CharacterStateMachine {
  private readonly actions = new Map<string, AnimationAction>();

  private currentState: CharacterAnimState | null = null;

  private readonly listeners = new Set<TransitionListener>();

  /**
   * mixer와 clip 목록을 받아 상태 전환 가능한 action 맵을 초기화합니다.
   */
  public constructor({ clips, initialState, mixer }: CharacterStateMachineOptions) {
    clips.forEach(clip => {
      this.actions.set(clip.name, mixer.clipAction(clip));
    });

    if (initialState) {
      this.transition(initialState, 0);
    }
  }

  /**
   * 현재 활성 상태 이름을 반환합니다.
   */
  public getCurrentState(): CharacterAnimState | null {
    return this.currentState;
  }

  /**
   * 현재 상태를 다른 clip state로 전환합니다.
   */
  public transition(to: CharacterAnimState, fadeDuration = 0.3): void {
    if (this.currentState === to) return;

    const nextAction = this.actions.get(to);

    if (!nextAction) return;

    const previousState = this.currentState;
    const previousAction = previousState ? this.actions.get(previousState) : null;

    nextAction.reset();
    configureActionLoop(nextAction, to);
    syncActionTime(previousAction, nextAction, to);

    if (previousAction) {
      nextAction.crossFadeFrom(previousAction, fadeDuration, false).play();
    } else {
      nextAction.fadeIn(fadeDuration).play();
    }

    this.currentState = to;
    this.listeners.forEach(listener => {
      listener(previousState, to);
    });
  }

  /**
   * 현재 상태를 유지한 채 특정 clip을 1회성으로 재생합니다.
   */
  public play(name: string): void {
    const action = this.actions.get(name);

    if (!action) return;

    action.clampWhenFinished = true;
    action.reset().setLoop(LoopOnce, 1).play();
  }

  /**
   * 상태 전환 시점을 구독합니다.
   */
  public onTransition(callback: TransitionListener): void {
    this.listeners.add(callback);
  }

  /**
   * 등록된 상태 전환 구독을 해제합니다.
   */
  public offTransition(callback: TransitionListener): void {
    this.listeners.delete(callback);
  }
}

/**
 * 전환 직전에 이전 action의 진행률을 다음 action 시간으로 맞춥니다.
 * spine translation이 들어 있는 clip을 항상 0프레임에서 시작하면 전환 순간 자세가 튈 수 있어,
 * 비슷한 리듬을 가진 상태끼리는 현재 progress를 최대한 이어받도록 합니다.
 */
const syncActionTime = (
  previousAction: AnimationAction | undefined | null,
  nextAction: AnimationAction,
  nextState: CharacterAnimState,
) => {
  if (!previousAction) return;
  if (!isLoopingCharacterAnimState(nextState)) return;

  const previousDuration = previousAction.getClip().duration;
  const nextDuration = nextAction.getClip().duration;

  if (previousDuration <= 0 || nextDuration <= 0) return;

  const normalizedTime = previousAction.time / previousDuration;
  nextAction.time = normalizedTime * nextDuration;
};

/**
 * 상태 성격에 맞춰 loop/clamp 정책을 고정합니다.
 * typing/notification은 1회성으로 시작해야 중간 progress sync나 반복 재생으로 두 번 동작하지 않습니다.
 */
const configureActionLoop = (action: AnimationAction, state: CharacterAnimState) => {
  if (isLoopingCharacterAnimState(state)) {
    action.clampWhenFinished = false;
    action.setLoop(LoopRepeat, Infinity);
    action.setEffectiveTimeScale(resolveActionTimeScale(state));
    return;
  }

  action.clampWhenFinished = true;
  action.setLoop(LoopOnce, 1);
  action.setEffectiveTimeScale(resolveActionTimeScale(state));
};

/**
 * 상태별 clip 재생 속도를 반환합니다.
 * contact의 music loop는 조금 더 여유 있게 반복되도록 기본 배속보다 느리게 유지합니다.
 */
const resolveActionTimeScale = (state: CharacterAnimState): number => {
  if (state === 'music') return 0.78;
  return 1;
};
