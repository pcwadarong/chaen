'use client';

import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';
import type { Material, Object3D } from 'three';

import type { CharacterAnimState } from '@/entities/character/model/character-animation-state';

type UseHeartAnimationOptions = Readonly<{
  currentState: CharacterAnimState;
  heartMesh: Object3D | null;
  laptopMesh: Object3D | null;
}>;

const HEART_APPEAR_TIME_MS = 100;
const HEART_MOVE_OFFSET = {
  x: -0.1,
  y: 0.3,
} as const;
const HEART_ROTATION_OFFSET = {
  y: 0.18,
  z: -0.14,
} as const;

/**
 * heart 등장 연출과 music 상태의 laptop visibility를 함께 제어합니다.
 */
export const useHeartAnimation = ({
  currentState,
  heartMesh,
  laptopMesh,
}: UseHeartAnimationOptions): void => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialPositionRef = useRef<{ x: number; y: number } | null>(null);
  const initialRotationRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const notificationStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (heartMesh) {
      heartMesh.visible = false;
      initialPositionRef.current = {
        x: heartMesh.position.x,
        y: heartMesh.position.y,
      };
      initialRotationRef.current = {
        x: heartMesh.rotation.x,
        y: heartMesh.rotation.y,
        z: heartMesh.rotation.z,
      };
    }

    if (laptopMesh) laptopMesh.visible = true;
  }, [heartMesh, laptopMesh]);

  useEffect(() => {
    if (!laptopMesh) return;

    laptopMesh.visible = currentState !== 'music';
  }, [currentState, laptopMesh]);

  useEffect(() => {
    if (currentState === 'notification') {
      notificationStartTimeRef.current ??= performance.now();
      return;
    }

    notificationStartTimeRef.current = null;
  }, [currentState]);

  useEffect(() => {
    if (!heartMesh) return;

    if (currentState !== 'notification') {
      resetHeartAnimation(
        heartMesh,
        timeoutRef.current,
        initialPositionRef.current,
        initialRotationRef.current,
      );
      timeoutRef.current = null;
      return;
    }

    const material = getOpacityMaterial(heartMesh);
    const notificationStartTime = notificationStartTimeRef.current ?? performance.now();
    const elapsedTimeMs = performance.now() - notificationStartTime;
    const remainingDelay = Math.max(0, HEART_APPEAR_TIME_MS - elapsedTimeMs);

    timeoutRef.current = setTimeout(() => {
      heartMesh.visible = true;

      gsap.to(heartMesh.position, {
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => {
          resetHeartState(
            heartMesh,
            initialPositionRef.current,
            initialRotationRef.current,
            material,
          );
        },
        x: (initialPositionRef.current?.x ?? 0) + HEART_MOVE_OFFSET.x,
        y: (initialPositionRef.current?.y ?? 0) + HEART_MOVE_OFFSET.y,
      });
      gsap.to(heartMesh.rotation, {
        duration: 0.8,
        ease: 'power2.out',
        y: (initialRotationRef.current?.y ?? 0) + HEART_ROTATION_OFFSET.y,
        z: (initialRotationRef.current?.z ?? 0) + HEART_ROTATION_OFFSET.z,
      });

      if (material) {
        material.opacity = 1;
        gsap.to(material, {
          duration: 0.8,
          ease: 'power2.out',
          opacity: 0,
        });
      }
    }, remainingDelay);

    return () => {
      resetHeartAnimation(
        heartMesh,
        timeoutRef.current,
        initialPositionRef.current,
        initialRotationRef.current,
      );
      timeoutRef.current = null;
    };
  }, [currentState, heartMesh]);
};

/**
 * heart 관련 타이머와 tween을 정리하고 초기 상태로 되돌립니다.
 */
const resetHeartAnimation = (
  heartMesh: Object3D,
  timer: ReturnType<typeof setTimeout> | null,
  initialPosition: { x: number; y: number } | null,
  initialRotation: { x: number; y: number; z: number } | null,
) => {
  if (timer) clearTimeout(timer);

  gsap.killTweensOf(heartMesh.position);
  gsap.killTweensOf(heartMesh.rotation);

  const material = getOpacityMaterial(heartMesh);
  if (material) gsap.killTweensOf(material);

  resetHeartState(heartMesh, initialPosition, initialRotation, material);
};

/**
 * heart의 visible, 위치, opacity를 기본값으로 돌립니다.
 */
const resetHeartState = (
  heartMesh: Object3D,
  initialPosition: { x: number; y: number } | null,
  initialRotation: { x: number; y: number; z: number } | null,
  material: MaterialWithOpacity | null,
) => {
  heartMesh.visible = false;
  heartMesh.position.x = initialPosition?.x ?? 0;
  heartMesh.position.y = initialPosition?.y ?? 0;
  heartMesh.rotation.x = initialRotation?.x ?? 0;
  heartMesh.rotation.y = initialRotation?.y ?? 0;
  heartMesh.rotation.z = initialRotation?.z ?? 0;

  if (material) material.opacity = 1;
};

type MaterialWithOpacity = Material & { opacity: number };

/**
 * opacity를 가진 단일 material만 안전하게 꺼냅니다.
 */
const getOpacityMaterial = (object: Object3D): MaterialWithOpacity | null => {
  if (!('material' in object)) return null;
  if (Array.isArray(object.material)) return null;

  const material = object.material;

  if (!material || typeof material !== 'object') return null;
  if (!('opacity' in material)) return null;

  return material as MaterialWithOpacity;
};
