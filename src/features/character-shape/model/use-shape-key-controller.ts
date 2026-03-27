'use client';

import { gsap } from 'gsap';
import { useCallback, useEffect, useRef } from 'react';
import type { Mesh } from 'three';

import type { CharacterAnimState } from '@/entities/character/model/character-animation-state';
import type { CharacterClipDurations } from '@/entities/character/model/character-clip-durations';

type MorphState = Record<string, number>;

type MorphMesh = Mesh & {
  morphTargetDictionary?: Record<string, number>;
  morphTargetInfluences?: number[];
};

type UseShapeKeyControllerOptions = Readonly<{
  browMesh: Mesh | null;
  clipDurations: CharacterClipDurations;
  currentState: CharacterAnimState;
  eyebrowMesh: Mesh | null;
  headMesh: Mesh | null;
}>;

type MorphAnimationProfile = Readonly<{
  enterDuration: number;
  releaseDuration?: number;
  releaseLeadMs?: number;
}>;

const HEAD_MORPH_KEYS = ['eye_close', 'mouth_smile', 'mouth_curious'] as const;
const BROW_MORPH_KEYS = ['up', 'down'] as const;
const EYEBROW_MORPH_KEYS = ['eye_close'] as const;
const TYPING_RELEASE_LEAD_MS = 500;
const NOTIFICATION_IDLE_RELEASE_DURATION = 0.6;

const STATE_MORPH_TARGETS: Record<
  CharacterAnimState,
  {
    brow: MorphState;
    eyebrow: MorphState;
    head: MorphState;
  }
> = {
  idle: {
    brow: {
      down: 0,
      up: 0,
    },
    eyebrow: {
      eye_close: 0,
    },
    head: {
      eye_close: 0,
      mouth_curious: 0,
      mouth_smile: 0,
    },
  },
  music: {
    brow: {
      down: 0,
      up: 0,
    },
    eyebrow: {
      eye_close: 1,
    },
    head: {
      eye_close: 1,
      mouth_curious: 0,
      mouth_smile: 1,
    },
  },
  notification: {
    brow: {
      down: 0,
      up: 1,
    },
    eyebrow: {
      eye_close: 0,
    },
    head: {
      eye_close: 0,
      mouth_curious: 0,
      mouth_smile: 1,
    },
  },
  typing: {
    brow: {
      down: 1,
      up: 0,
    },
    eyebrow: {
      eye_close: 0.3,
    },
    head: {
      eye_close: 0.3,
      mouth_curious: 1,
      mouth_smile: 0,
    },
  },
};

const STATE_MORPH_PROFILES: Record<CharacterAnimState, MorphAnimationProfile> = {
  idle: {
    enterDuration: 0.24,
  },
  music: {
    enterDuration: 0.3,
  },
  notification: {
    enterDuration: 0.85,
  },
  typing: {
    enterDuration: 0.24,
    releaseDuration: 0.24,
    releaseLeadMs: TYPING_RELEASE_LEAD_MS,
  },
};

/**
 * notification은 진입도 빠르게 세우지 않고, 빠져나갈 때도 급하게 0으로 꺼뜨리지 않습니다.
 * 그래서 `idle` 자체의 기본 속도와 별개로, "notification 직후 idle" 전환에만 완만한 release를 씁니다.
 */
const NOTIFICATION_EXIT_TO_IDLE_PROFILE: MorphAnimationProfile = {
  enterDuration: NOTIFICATION_IDLE_RELEASE_DURATION,
};

/**
 * 상태 이벤트에 대응하는 기본 표정 Shape Key를 제어합니다.
 * 이 훅은 typing/music/notification처럼 "목표값에 정확히 도착해야 하는" 표정만 담당합니다.
 * idle에서의 blink처럼 연속 상태 성격의 eye_close 변화는 useBlinkAnimation이 전담합니다.
 *
 * 타이밍 정책은 상태별로 다릅니다.
 * - `typing`: 빨리 진입하되 clip 종료 0.5초 전에 중립으로 되돌린다.
 * - `notification`: 더 느리게 웃음 표정으로 올라가고, idle로 풀릴 때도 완만하게 푼다.
 * - `music`, `idle`: 상태 전환에 맞춰 짧고 단순한 보간만 적용한다.
 */
export const useShapeKeyController = ({
  browMesh,
  clipDurations,
  currentState,
  eyebrowMesh,
  headMesh,
}: UseShapeKeyControllerOptions): {
  browMorphs: MorphState;
  eyebrowMorphs: MorphState;
  headMorphs: MorphState;
  setMorph: (mesh: Mesh | null, key: string, value: number) => void;
} => {
  const browMorphsRef = useRef<MorphState>(createMorphState(BROW_MORPH_KEYS));
  const headMorphsRef = useRef<MorphState>(createMorphState(HEAD_MORPH_KEYS));
  const eyebrowMorphsRef = useRef<MorphState>(createMorphState(EYEBROW_MORPH_KEYS));
  const previousStateRef = useRef<CharacterAnimState | null>(null);
  const releaseTimerIdsRef = useRef<number[]>([]);

  const setMorph = useCallback(
    (mesh: Mesh | null, key: string, value: number) => {
      if (!mesh) return;

      const targetState =
        mesh === browMesh
          ? browMorphsRef.current
          : mesh === headMesh
            ? headMorphsRef.current
            : mesh === eyebrowMesh
              ? eyebrowMorphsRef.current
              : null;

      if (!targetState) return;

      targetState[key] = value;
      setMorphTarget(mesh, key, value);
    },
    [browMesh, eyebrowMesh, headMesh],
  );

  useEffect(() => {
    applyMorphState(browMesh, browMorphsRef.current);
  }, [browMesh]);

  useEffect(() => {
    applyMorphState(headMesh, headMorphsRef.current);
  }, [headMesh]);

  useEffect(() => {
    applyMorphState(eyebrowMesh, eyebrowMorphsRef.current);
  }, [eyebrowMesh]);

  useEffect(() => {
    const previousState = previousStateRef.current;
    const targets = STATE_MORPH_TARGETS[currentState];
    const profile = resolveMorphAnimationProfile(currentState, previousState);
    const releaseTimerIds = releaseTimerIdsRef.current;

    // 같은 mesh라도 상태가 바뀌면 이전 tween/timer를 끊고, 새 상태의 표정 계획을 처음부터 적용합니다.
    clearMorphReleaseTimers(releaseTimerIds);
    gsap.killTweensOf(browMorphsRef.current);
    gsap.killTweensOf(headMorphsRef.current);
    gsap.killTweensOf(eyebrowMorphsRef.current);

    animateMorphState({
      duration: profile.enterDuration,
      mesh: browMesh,
      nextState: targets.brow,
      stateRef: browMorphsRef.current,
    });
    animateMorphState({
      duration: profile.enterDuration,
      mesh: headMesh,
      nextState: targets.head,
      stateRef: headMorphsRef.current,
    });
    animateMorphState({
      duration: profile.enterDuration,
      mesh: eyebrowMesh,
      nextState: targets.eyebrow,
      stateRef: eyebrowMorphsRef.current,
    });

    if (currentState === 'typing') {
      scheduleMorphRelease({
        duration: profile.releaseDuration ?? 0,
        mesh: browMesh,
        nextState: STATE_MORPH_TARGETS.idle.brow,
        releaseDelayMs: resolveTypingReleaseDelayMs(clipDurations.typing, profile),
        stateRef: browMorphsRef.current,
        timerIds: releaseTimerIds,
      });
      scheduleMorphRelease({
        duration: profile.releaseDuration ?? 0,
        mesh: headMesh,
        nextState: STATE_MORPH_TARGETS.idle.head,
        releaseDelayMs: resolveTypingReleaseDelayMs(clipDurations.typing, profile),
        stateRef: headMorphsRef.current,
        timerIds: releaseTimerIds,
      });
      scheduleMorphRelease({
        duration: profile.releaseDuration ?? 0,
        mesh: eyebrowMesh,
        nextState: STATE_MORPH_TARGETS.idle.eyebrow,
        releaseDelayMs: resolveTypingReleaseDelayMs(clipDurations.typing, profile),
        stateRef: eyebrowMorphsRef.current,
        timerIds: releaseTimerIds,
      });
    }

    previousStateRef.current = currentState;

    return () => {
      clearMorphReleaseTimers(releaseTimerIds);
    };
  }, [browMesh, clipDurations.typing, currentState, eyebrowMesh, headMesh]);

  return {
    browMorphs: browMorphsRef.current,
    eyebrowMorphs: eyebrowMorphsRef.current,
    headMorphs: headMorphsRef.current,
    setMorph,
  };
};

/**
 * 지정한 morph key 목록을 0으로 초기화한 상태 객체를 만듭니다.
 */
const createMorphState = (keys: readonly string[]): MorphState =>
  Object.fromEntries(keys.map(key => [key, 0]));

/**
 * 상태 객체의 각 morph 값을 실제 mesh influence 배열에 반영합니다.
 */
const applyMorphState = (mesh: Mesh | null, state: MorphState): void => {
  Object.entries(state).forEach(([key, value]) => {
    setMorphTarget(mesh, key, value);
  });
};

/**
 * 상태별 목표 표정을 지정한 시간 동안 보간해 적용합니다.
 */
const animateMorphState = ({
  duration,
  mesh,
  nextState,
  stateRef,
}: {
  duration: number;
  mesh: Mesh | null;
  nextState: MorphState;
  stateRef: MorphState;
}) => {
  // morph state 객체 자체를 tween 대상으로 두고, onUpdate마다 실제 influence 배열에 반영합니다.
  // 이렇게 하면 mesh가 없는 경우/shape key가 일부만 있는 경우를 setMorphTarget이 계속 흡수할 수 있습니다.
  gsap.to(stateRef, {
    ...nextState,
    duration,
    ease: 'power2.inOut',
    onUpdate: () => {
      applyMorphState(mesh, stateRef);
    },
  });
};

/**
 * typing 상태에서 표정을 clip 종료보다 조금 먼저 중립으로 되돌리도록 예약합니다.
 * 즉, body animation은 계속 가더라도 감정은 후반 0.5초 전에 먼저 정리됩니다.
 */
const scheduleMorphRelease = ({
  duration,
  mesh,
  nextState,
  releaseDelayMs,
  stateRef,
  timerIds,
}: {
  duration: number;
  mesh: Mesh | null;
  nextState: MorphState;
  releaseDelayMs: number;
  stateRef: MorphState;
  timerIds: number[];
}) => {
  const timerId = window.setTimeout(() => {
    animateMorphState({
      duration,
      mesh,
      nextState,
      stateRef,
    });
  }, releaseDelayMs);

  timerIds.push(timerId);
};

/**
 * 누적된 morph release 타이머를 모두 정리합니다.
 */
const clearMorphReleaseTimers = (timerIds: number[]) => {
  timerIds.forEach(timerId => {
    window.clearTimeout(timerId);
  });
  timerIds.length = 0;
};

/**
 * 현재 상태와 직전 상태를 함께 보고, 이번 전환에 맞는 morph 속도 계획을 결정합니다.
 */
const resolveMorphAnimationProfile = (
  currentState: CharacterAnimState,
  previousState: CharacterAnimState | null,
): MorphAnimationProfile => {
  if (currentState === 'idle' && previousState === 'notification') {
    return NOTIFICATION_EXIT_TO_IDLE_PROFILE;
  }

  return STATE_MORPH_PROFILES[currentState];
};

/**
 * typing 표정이 clip 종료 0.5초 전에 끝나도록 release 시작 시점을 계산합니다.
 */
const resolveTypingReleaseDelayMs = (
  clipDurationMs: number,
  profile: MorphAnimationProfile,
): number => {
  const releaseLeadMs = profile.releaseLeadMs ?? 0;
  const releaseDurationMs = (profile.releaseDuration ?? 0) * 1000;

  return Math.max(clipDurationMs - releaseLeadMs - releaseDurationMs, 0);
};

/**
 * morph target key를 안전하게 influence에 반영합니다.
 * 이 헬퍼는 "mesh가 없거나 morph dictionary가 다를 수 있다"는 전제를 흡수합니다.
 * useShapeKeyController와 useBlinkAnimation이 공통으로 사용합니다.
 */
export const setMorphTarget = (mesh: Mesh | null, key: string, value: number): void => {
  if (!mesh) return;

  const morphMesh = mesh as MorphMesh;
  const dictionary = morphMesh.morphTargetDictionary;
  const influences = morphMesh.morphTargetInfluences;

  if (!dictionary || !influences) return;

  const index = dictionary[key];

  if (typeof index !== 'number') return;

  influences[index] = value;
};
