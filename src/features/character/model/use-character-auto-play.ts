'use client';

import { useEffect, useMemo } from 'react';
import type { AnimationClip } from 'three';

import type { CharacterAnimState } from '@/features/character/model/use-character-state';

type CharacterInstanceType = 'main' | 'contact';

type UseCharacterAutoPlayOptions = Readonly<{
  clips: AnimationClip[];
  currentState: CharacterAnimState;
  instance: CharacterInstanceType;
  transitionTo: (state: CharacterAnimState) => void;
}>;

const IDLE_DELAY_BASE_MS = 3200;
const IDLE_DELAY_RANDOM_MS = 2800;
const DEFAULT_CLIP_DURATION_MS = 1800;

/**
 * 메인 캐릭터가 idle에서 시작해 typing, notification을 간헐적으로 순환하도록 제어합니다.
 * contact 인스턴스는 music 고정이므로 자동 재생 대상에서 제외합니다.
 */
export const useCharacterAutoPlay = ({
  clips,
  currentState,
  instance,
  transitionTo,
}: UseCharacterAutoPlayOptions): void => {
  const clipDurations = useMemo(
    () => ({
      notification: resolveClipDuration(clips, 'notification'),
      typing: resolveClipDuration(clips, 'typing'),
    }),
    [clips],
  );

  useEffect(() => {
    if (instance !== 'main') return;

    if (currentState === 'idle') {
      const timer = window.setTimeout(
        () => {
          transitionTo('typing');
        },
        IDLE_DELAY_BASE_MS + Math.random() * IDLE_DELAY_RANDOM_MS,
      );

      return () => {
        window.clearTimeout(timer);
      };
    }

    if (currentState === 'typing') {
      const timer = window.setTimeout(() => {
        transitionTo('notification');
      }, clipDurations.typing);

      return () => {
        window.clearTimeout(timer);
      };
    }

    if (currentState === 'notification') {
      const timer = window.setTimeout(() => {
        transitionTo('idle');
      }, clipDurations.notification);

      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [clipDurations.notification, clipDurations.typing, currentState, instance, transitionTo]);
};

/**
 * clip 이름에 해당하는 재생 길이를 찾아 ms 단위로 반환합니다.
 * clip이 없으면 상태 순환이 멈추지 않게 기본 길이를 사용합니다.
 */
const resolveClipDuration = (clips: AnimationClip[], name: CharacterAnimState): number => {
  const clip = clips.find(item => item.name === name);

  if (!clip) return DEFAULT_CLIP_DURATION_MS;

  return Math.max(clip.duration * 1000, 300);
};
