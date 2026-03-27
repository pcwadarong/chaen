'use client';

import { useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef } from 'react';
import type { Object3D } from 'three';

import { useInteractionActions } from '@/features/interaction/model/useInteractionActions';
import { useRaycaster } from '@/features/interaction/model/useRaycaster';
import { OutlineEffect } from '@/features/interaction/ui/outline-effect';

type SceneInteractionControllerProps = Readonly<{
  onBrowseProjects?: () => void;
  onOpenImageViewer?: () => void;
  onPlayBassString?: (stringName: 'line1' | 'line2' | 'line3' | 'line4') => void | Promise<void>;
  onToggleBackgroundMusicPlayback?: () => void | Promise<void>;
}>;

const KEYBOARD_INTERACTION_TARGET_NAMES = ['laptop', 'bass_body', 'camera'] as const;
const KEYBOARD_ACTIVATION_KEYS = new Set(['Enter', ' ']);
const KEYBOARD_NAVIGATION_KEYS = new Set(['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp']);

/**
 * canvas DOM 포인터 이벤트와 3D interaction 훅을 연결합니다.
 * hit test, hover 액션, click 액션, outline 렌더를 한 곳에서 조합합니다.
 */
export const SceneInteractionController = ({
  onBrowseProjects,
  onOpenImageViewer,
  onPlayBassString,
  onToggleBackgroundMusicPlayback,
}: SceneInteractionControllerProps) => {
  const { gl, scene } = useThree();
  const { handleMeshClick } = useInteractionActions({
    onBrowseProjects,
    onOpenImageViewer,
    onPlayBassString,
    onToggleBackgroundMusicPlayback,
  });
  const {
    hoveredOutlineMeshes,
    onPointerClick,
    onPointerMove,
    clearHoveredMesh,
    setHoveredMeshDirect,
  } = useRaycaster({
    onMeshClick: mesh => {
      handleMeshClick(mesh);
    },
  });
  const keyboardTargetIndexRef = useRef(-1);
  const keyboardTargets = useMemo(() => resolveKeyboardInteractionTargets(scene), [scene]);

  useEffect(() => {
    const canvasElement = gl.domElement;
    const previousAriaLabel = canvasElement.getAttribute('aria-label');
    const previousTabIndex = canvasElement.tabIndex;

    canvasElement.tabIndex = 0;

    if (previousAriaLabel === null) {
      canvasElement.setAttribute('aria-label', '홈 씬 상호작용 캔버스');
    }

    const handlePointerMove = (event: PointerEvent) => {
      onPointerMove(event);
    };
    const handlePointerDownOrUp = (event: PointerEvent) => {
      onPointerClick(event);
    };
    const handlePointerLeave = () => {
      clearHoveredMesh();
    };
    const syncKeyboardTargetByIndex = (nextIndex: number) => {
      const nextTarget = keyboardTargets[nextIndex] ?? null;

      keyboardTargetIndexRef.current = nextTarget ? nextIndex : -1;
      setHoveredMeshDirect(nextTarget);
    };
    const handleFocus = () => {
      if (keyboardTargets.length === 0) return;

      const nextIndex = keyboardTargetIndexRef.current >= 0 ? keyboardTargetIndexRef.current : 0;

      syncKeyboardTargetByIndex(nextIndex);
    };
    const handleBlur = () => {
      keyboardTargetIndexRef.current = -1;
      clearHoveredMesh();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (keyboardTargets.length === 0) return;

      if (KEYBOARD_NAVIGATION_KEYS.has(event.key)) {
        event.preventDefault();

        const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
        const currentIndex =
          keyboardTargetIndexRef.current >= 0 ? keyboardTargetIndexRef.current : 0;
        const nextIndex =
          (currentIndex + direction + keyboardTargets.length) % keyboardTargets.length;

        syncKeyboardTargetByIndex(nextIndex);
        return;
      }

      if (!KEYBOARD_ACTIVATION_KEYS.has(event.key)) return;

      event.preventDefault();

      const targetIndex = keyboardTargetIndexRef.current >= 0 ? keyboardTargetIndexRef.current : 0;
      const target = keyboardTargets[targetIndex];

      if (!target) return;

      syncKeyboardTargetByIndex(targetIndex);
      handleMeshClick(target);
    };

    canvasElement.addEventListener('pointermove', handlePointerMove);
    canvasElement.addEventListener('pointerdown', handlePointerDownOrUp);
    canvasElement.addEventListener('pointerup', handlePointerDownOrUp);
    canvasElement.addEventListener('pointerleave', handlePointerLeave);
    canvasElement.addEventListener('focus', handleFocus);
    canvasElement.addEventListener('blur', handleBlur);
    canvasElement.addEventListener('keydown', handleKeyDown);

    return () => {
      canvasElement.removeEventListener('pointermove', handlePointerMove);
      canvasElement.removeEventListener('pointerdown', handlePointerDownOrUp);
      canvasElement.removeEventListener('pointerup', handlePointerDownOrUp);
      canvasElement.removeEventListener('pointerleave', handlePointerLeave);
      canvasElement.removeEventListener('focus', handleFocus);
      canvasElement.removeEventListener('blur', handleBlur);
      canvasElement.removeEventListener('keydown', handleKeyDown);

      if (previousAriaLabel === null) {
        canvasElement.removeAttribute('aria-label');
      } else {
        canvasElement.setAttribute('aria-label', previousAriaLabel);
      }

      canvasElement.tabIndex = previousTabIndex;
    };
  }, [
    clearHoveredMesh,
    gl,
    handleMeshClick,
    keyboardTargets,
    onPointerClick,
    onPointerMove,
    setHoveredMeshDirect,
  ]);

  return <OutlineEffect hoveredMeshes={hoveredOutlineMeshes} />;
};

/**
 * 키보드 포커스로 순회할 대표 interaction mesh를 씬에서 순서대로 수집합니다.
 */
const resolveKeyboardInteractionTargets = (scene: Object3D): Object3D[] =>
  KEYBOARD_INTERACTION_TARGET_NAMES.map(name => scene.getObjectByName(name)).filter(
    (target): target is Object3D => target !== undefined,
  );
