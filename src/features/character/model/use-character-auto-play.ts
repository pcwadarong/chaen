'use client';

import { useEffect, useRef } from 'react';

import type { CharacterClipDurations } from '@/features/character/model/character-clip-durations';
import type { CharacterAnimState } from '@/features/character/model/use-character-state';

type CharacterInstanceType = 'main' | 'contact';

type UseCharacterAutoPlayOptions = Readonly<{
  clipDurations: CharacterClipDurations;
  currentState: CharacterAnimState;
  instance: CharacterInstanceType;
  transitionTo: (state: CharacterAnimState) => void;
}>;

const IDLE_DELAY_BASE_MS = 3200;
const IDLE_DELAY_RANDOM_MS = 2800;

type ScheduledState = Exclude<CharacterAnimState, 'idle' | 'music'>;

/**
 * 메인 캐릭터가 idle에서 시작해 typing, notification을 간헐적으로 순환하도록 제어합니다.
 * contact 인스턴스는 music 고정이므로 자동 재생 대상에서 제외합니다.
 */
export const useCharacterAutoPlay = ({
  clipDurations,
  currentState,
  instance,
  transitionTo,
}: UseCharacterAutoPlayOptions): void => {
  const nextStateAfterIdleRef = useRef<ScheduledState>('typing');

  useEffect(() => {
    if (instance !== 'main') return;

    if (currentState === 'idle') {
      const timer = window.setTimeout(
        () => {
          transitionTo(nextStateAfterIdleRef.current);
        },
        IDLE_DELAY_BASE_MS + Math.random() * IDLE_DELAY_RANDOM_MS,
      );

      return () => {
        window.clearTimeout(timer);
      };
    }

    if (currentState === 'typing') {
      const timer = window.setTimeout(() => {
        nextStateAfterIdleRef.current = 'notification';
        transitionTo('idle');
      }, clipDurations.typing);

      return () => {
        window.clearTimeout(timer);
      };
    }

    if (currentState === 'notification') {
      const timer = window.setTimeout(() => {
        nextStateAfterIdleRef.current = 'typing';
        transitionTo('idle');
      }, clipDurations.notification);

      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [clipDurations.notification, clipDurations.typing, currentState, instance, transitionTo]);
};
