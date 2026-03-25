'use client';

import type { AnimationClip, AnimationMixer } from 'three';

import type { CharacterAnimState } from '@/entities/character/model/character-animation-state';
import type { CharacterClipDurations } from '@/entities/character/model/character-clip-durations';
import { useCharacterAutoPlay } from '@/features/character-animation/model/use-character-auto-play';
import { useCharacterState } from '@/features/character-animation/model/use-character-state';

type CharacterInstanceType = 'main' | 'contact';

type UseCharacterAnimationOptions = Readonly<{
  clipDurations: CharacterClipDurations;
  clips: AnimationClip[];
  instance: CharacterInstanceType;
  mixer: AnimationMixer;
}>;

/**
 * 캐릭터의 상태머신과 idle 순환 재생을 한 feature 내부에서 함께 조율합니다.
 * `Character`는 이 훅에서 현재 상태만 받아 표정/보조 연출에 넘기고,
 * 상태 전환 세부 구현은 character-animation feature 내부에 유지합니다.
 */
export const useCharacterAnimation = ({
  clipDurations,
  clips,
  instance,
  mixer,
}: UseCharacterAnimationOptions): {
  currentState: CharacterAnimState;
  transitionTo: (state: CharacterAnimState) => void;
} => {
  const { currentState, transitionTo } = useCharacterState({
    clips,
    instance,
    mixer,
  });

  useCharacterAutoPlay({
    clipDurations,
    currentState,
    instance,
    transitionTo,
  });

  return {
    currentState,
    transitionTo,
  };
};
