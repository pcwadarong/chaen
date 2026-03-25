'use client';

import { useCallback, useMemo, useState } from 'react';
import type { AnimationClip, AnimationMixer } from 'three';

import { CharacterStateMachine } from '@/entities/character/model/character-state-machine';

export type CharacterAnimState = 'idle' | 'typing' | 'notification' | 'music';

type CharacterInstanceType = 'main' | 'contact';

type UseCharacterStateOptions = Readonly<{
  clips: AnimationClip[];
  instance: CharacterInstanceType;
  mixer: AnimationMixer;
}>;

const INSTANCE_INITIAL_STATE: Record<CharacterInstanceType, CharacterAnimState> = {
  contact: 'music',
  main: 'idle',
};

const STATE_FADE_DURATIONS: Record<CharacterAnimState, number> = {
  idle: 0.2,
  music: 0.18,
  notification: 0.08,
  typing: 0.12,
};

/**
 * 캐릭터 인스턴스별 초기 상태와 전환 가능 범위를 React 훅으로 관리합니다.
 */
export const useCharacterState = ({
  clips,
  instance,
  mixer,
}: UseCharacterStateOptions): {
  currentState: CharacterAnimState;
  transitionTo: (state: CharacterAnimState) => void;
} => {
  const initialState = INSTANCE_INITIAL_STATE[instance];
  const [currentState, setCurrentState] = useState<CharacterAnimState>(initialState);
  const stateMachine = useMemo(
    () =>
      new CharacterStateMachine({
        clips,
        initialState,
        mixer,
      }),
    [clips, initialState, mixer],
  );

  const transitionTo = useCallback(
    (state: CharacterAnimState) => {
      if (instance === 'contact') return;

      stateMachine.transition(state, STATE_FADE_DURATIONS[state]);

      const nextState = stateMachine.getCurrentState();
      if (nextState) setCurrentState(nextState as CharacterAnimState);
    },
    [instance, stateMachine],
  );

  return {
    currentState,
    transitionTo,
  };
};
