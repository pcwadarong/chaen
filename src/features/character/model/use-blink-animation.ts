'use client';

import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';
import type { Mesh } from 'three';

import type { CharacterAnimState } from '@/features/character/model/use-character-state';
import { setMorphTarget } from '@/features/character/model/use-shape-key-controller';

type UseBlinkAnimationOptions = Readonly<{
  currentState: CharacterAnimState;
  eyebrowMesh: Mesh | null;
  headMesh: Mesh | null;
}>;

const BLINK_MIN_DELAY_MS = 3000;
const BLINK_RANDOM_DELAY_MS = 3000;

/**
 * idle 상태에서만 eye_close를 연속 상태로 제어합니다.
 * typing/music/notification 표정은 useShapeKeyController가 정확한 목표값으로 고정하고,
 * 이 훅은 그와 분리된 "blink만의 미세 변화"를 head/eyebrow에 덮어쓰는 용도입니다.
 */
export const useBlinkAnimation = ({
  currentState,
  eyebrowMesh,
  headMesh,
}: UseBlinkAnimationOptions): void => {
  const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const blinkValuesRef = useRef({
    eyebrowEyeClose: 0,
    headEyeClose: 0,
  });

  useEffect(() => {
    const blinkValues = blinkValuesRef.current;

    if (currentState !== 'idle') {
      resetBlink(headMesh, eyebrowMesh, blinkTimerRef.current, timelineRef.current, blinkValues);
      blinkTimerRef.current = null;
      timelineRef.current = null;
      return;
    }

    const startBlink = () => {
      const delay = BLINK_MIN_DELAY_MS + Math.random() * BLINK_RANDOM_DELAY_MS;

      blinkTimerRef.current = setTimeout(() => {
        timelineRef.current?.kill();
        timelineRef.current = gsap
          .timeline()
          .to(blinkValues, {
            duration: 0.08,
            eyebrowEyeClose: 1,
            headEyeClose: 1,
            onUpdate: () => {
              setMorphTarget(headMesh, 'eye_close', blinkValues.headEyeClose);
              setMorphTarget(eyebrowMesh, 'eye_close', blinkValues.eyebrowEyeClose);
            },
          })
          .to(blinkValues, {
            duration: 0.12,
            eyebrowEyeClose: 0,
            headEyeClose: 0,
            onUpdate: () => {
              setMorphTarget(headMesh, 'eye_close', blinkValues.headEyeClose);
              setMorphTarget(eyebrowMesh, 'eye_close', blinkValues.eyebrowEyeClose);
            },
          });

        startBlink();
      }, delay);
    };

    startBlink();

    return () => {
      resetBlink(headMesh, eyebrowMesh, blinkTimerRef.current, timelineRef.current, blinkValues);
      blinkTimerRef.current = null;
      timelineRef.current = null;
    };
  }, [currentState, eyebrowMesh, headMesh]);
};

/**
 * blink 타이머와 timeline을 중단하고 eye_close morph를 기본값으로 복원합니다.
 * 상태가 idle이 아니게 되면 blink는 즉시 멈추고, 표정 제어권은 다시 useShapeKeyController 쪽으로 돌아갑니다.
 */
const resetBlink = (
  headMesh: Mesh | null,
  eyebrowMesh: Mesh | null,
  timer: ReturnType<typeof setTimeout> | null,
  timeline: gsap.core.Timeline | null,
  blinkValues: { eyebrowEyeClose: number; headEyeClose: number },
) => {
  if (timer) {
    clearTimeout(timer);
  }

  timeline?.kill();

  blinkValues.headEyeClose = 0;
  blinkValues.eyebrowEyeClose = 0;

  setMorphTarget(headMesh, 'eye_close', 0);
  setMorphTarget(eyebrowMesh, 'eye_close', 0);
};
