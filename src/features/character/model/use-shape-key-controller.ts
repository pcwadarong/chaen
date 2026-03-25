'use client';

import { gsap } from 'gsap';
import { useCallback, useEffect, useRef } from 'react';
import type { Mesh } from 'three';

import type { CharacterAnimState } from '@/features/character/model/use-character-state';

type MorphState = Record<string, number>;

type MorphMesh = Mesh & {
  morphTargetDictionary?: Record<string, number>;
  morphTargetInfluences?: number[];
};

type UseShapeKeyControllerOptions = Readonly<{
  browMesh: Mesh | null;
  currentState: CharacterAnimState;
  eyebrowMesh: Mesh | null;
  headMesh: Mesh | null;
}>;

const HEAD_MORPH_KEYS = ['eye_close', 'mouth_smile', 'mouth_curious'] as const;
const BROW_MORPH_KEYS = ['up', 'down'] as const;
const EYEBROW_MORPH_KEYS = ['eye_close'] as const;

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
      up: 1,
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
      eye_close: 0.5,
    },
    head: {
      eye_close: 0.5,
      mouth_curious: 1,
      mouth_smile: 0,
    },
  },
};

/**
 * 상태 이벤트에 대응하는 기본 표정 Shape Key를 제어합니다.
 * 이 훅은 typing/music/notification처럼 "목표값에 정확히 도착해야 하는" 표정만 담당합니다.
 * idle에서의 blink처럼 연속 상태 성격의 eye_close 변화는 useBlinkAnimation이 전담합니다.
 */
export const useShapeKeyController = ({
  browMesh,
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
    const targets = STATE_MORPH_TARGETS[currentState];

    gsap.killTweensOf(browMorphsRef.current);
    gsap.killTweensOf(headMorphsRef.current);
    gsap.killTweensOf(eyebrowMorphsRef.current);

    gsap.to(browMorphsRef.current, {
      ...targets.brow,
      duration: 0.4,
      ease: 'power2.inOut',
      onUpdate: () => {
        applyMorphState(browMesh, browMorphsRef.current);
      },
    });

    gsap.to(headMorphsRef.current, {
      ...targets.head,
      duration: 0.4,
      ease: 'power2.inOut',
      onUpdate: () => {
        applyMorphState(headMesh, headMorphsRef.current);
      },
    });

    gsap.to(eyebrowMorphsRef.current, {
      ...targets.eyebrow,
      duration: 0.4,
      ease: 'power2.inOut',
      onUpdate: () => {
        applyMorphState(eyebrowMesh, eyebrowMorphsRef.current);
      },
    });
  }, [browMesh, currentState, eyebrowMesh, headMesh]);

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
