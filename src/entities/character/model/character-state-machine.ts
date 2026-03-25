import type { AnimationAction, AnimationClip, AnimationMixer } from 'three';
import { LoopOnce } from 'three';

type CharacterStateMachineOptions = Readonly<{
  clips: AnimationClip[];
  initialState?: string;
  mixer: AnimationMixer;
}>;

type TransitionListener = (from: string | null, to: string) => void;

/**
 * 캐릭터 애니메이션 clip을 상태 단위로 전환하는 경량 상태머신입니다.
 */
export class CharacterStateMachine {
  private readonly actions = new Map<string, AnimationAction>();

  private currentState: string | null = null;

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
  public getCurrentState(): string | null {
    return this.currentState;
  }

  /**
   * 현재 상태를 다른 clip state로 전환합니다.
   */
  public transition(to: string, fadeDuration = 0.3): void {
    if (this.currentState === to) return;

    const nextAction = this.actions.get(to);

    if (!nextAction) return;

    const previousState = this.currentState;
    const previousAction = previousState ? this.actions.get(previousState) : null;

    previousAction?.fadeOut(fadeDuration);
    nextAction.reset().fadeIn(fadeDuration).play();

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
}
