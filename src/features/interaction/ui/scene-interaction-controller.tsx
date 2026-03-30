'use client';

import { useThree } from '@react-three/fiber';
import { useTranslations } from 'next-intl';
import React, { useEffect, useMemo, useRef } from 'react';
import type { Object3D } from 'three';

import { useInteractionActions } from '@/features/interaction/model/useInteractionActions';
import { useRaycaster } from '@/features/interaction/model/useRaycaster';
import { OutlineEffect } from '@/features/interaction/ui/outline-effect';
import { useIsTouchDevice } from '@/shared/lib/dom/use-is-touch-device';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

type SceneInteractionControllerProps = Readonly<{
  onBrowseProjects?: () => void;
  onOpenImageViewer?: () => void;
  onPlayBassString?: (stringName: 'line1' | 'line2' | 'line3' | 'line4') => void | Promise<void>;
  showOutlineEffect?: boolean;
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
  showOutlineEffect = true,
  onToggleBackgroundMusicPlayback,
}: SceneInteractionControllerProps) => {
  const t = useTranslations('SceneInteraction');
  const { gl, scene } = useThree();
  const isTouchDevice = useIsTouchDevice();
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
    const previousAriaDescribedBy = canvasElement.getAttribute('aria-describedby');
    const previousTabIndex = canvasElement.tabIndex;
    const helpTextElement = document.createElement('p');
    const statusElement = document.createElement('p');

    helpTextElement.id = 'scene-interaction-help-text';
    helpTextElement.className = srOnlyClass;
    helpTextElement.textContent = t('canvasHelpText');

    statusElement.id = 'scene-interaction-status';
    statusElement.className = srOnlyClass;
    statusElement.setAttribute('aria-live', 'polite');
    statusElement.setAttribute('role', 'status');
    statusElement.textContent = '';

    document.body.append(helpTextElement, statusElement);

    canvasElement.tabIndex = 0;
    canvasElement.setAttribute(
      'aria-describedby',
      [previousAriaDescribedBy, helpTextElement.id].filter(Boolean).join(' '),
    );

    if (previousAriaLabel === null) {
      canvasElement.setAttribute('aria-label', t('canvasAriaLabel'));
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

      statusElement.textContent = nextTarget
        ? t('keyboardTargetStatus', {
            target: resolveKeyboardTargetLabel(nextTarget.name, t),
          })
        : '';
    };
    const handleFocus = () => {
      if (keyboardTargets.length === 0) return;

      const nextIndex = keyboardTargetIndexRef.current >= 0 ? keyboardTargetIndexRef.current : 0;

      syncKeyboardTargetByIndex(nextIndex);
    };
    const handleBlur = () => {
      keyboardTargetIndexRef.current = -1;
      statusElement.textContent = '';
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

      if (previousAriaDescribedBy === null) {
        canvasElement.removeAttribute('aria-describedby');
      } else {
        canvasElement.setAttribute('aria-describedby', previousAriaDescribedBy);
      }

      canvasElement.tabIndex = previousTabIndex;
      helpTextElement.remove();
      statusElement.remove();
    };
  }, [
    clearHoveredMesh,
    gl,
    handleMeshClick,
    keyboardTargets,
    onPointerClick,
    onPointerMove,
    setHoveredMeshDirect,
    t,
  ]);

  // stacked / narrow-wide / coarse pointer에서는 outline composer 비용 대비 체감이 낮다.
  // wide desktop + fine pointer에서만 후처리 outline을 유지하고, 나머지는 이벤트 경로만 살린다.
  return showOutlineEffect && !isTouchDevice ? (
    <OutlineEffect hoveredMeshes={hoveredOutlineMeshes} />
  ) : null;
};

/**
 * 키보드 포커스로 순회할 대표 interaction mesh를 씬에서 순서대로 수집합니다.
 */
const resolveKeyboardInteractionTargets = (scene: Object3D): Object3D[] =>
  KEYBOARD_INTERACTION_TARGET_NAMES.map(name => scene.getObjectByName(name)).filter(
    (target): target is Object3D => target !== undefined,
  );

/**
 * 키보드 순회 대상의 내부 mesh 이름을 사용자가 이해할 수 있는 라벨로 변환합니다.
 */
const resolveKeyboardTargetLabel = (targetName: string, t: ReturnType<typeof useTranslations>) => {
  if (targetName === 'laptop') return t('targetLaptop');
  if (targetName === 'bass_body') return t('targetBass');

  return t('targetCamera');
};
