'use client';

import { useCallback, useMemo } from 'react';
import type { Object3D } from 'three';

type InteractionTarget = 'bass' | 'camera' | 'laptop' | null;

type InteractionAction = Readonly<{
  onClick: () => void;
}>;

type UseInteractionActionsOptions = Readonly<{
  onOpenImageViewer?: () => void;
}>;

/**
 * mesh 이름별 click 액션을 현재 홈 씬 요구사항에 맞춰 조합합니다.
 * 현재 커밋 범위에서는 camera만 임시 이미지 뷰어를 열고, 나머지 mesh는 outline만 담당합니다.
 */
export const useInteractionActions = ({
  onOpenImageViewer,
}: UseInteractionActionsOptions): {
  handleMeshClick: (mesh: Object3D) => void;
} => {
  const interactionActions = useMemo<Record<Exclude<InteractionTarget, null>, InteractionAction>>(
    () => ({
      bass: {
        onClick: () => {},
      },
      camera: {
        onClick: () => {
          onOpenImageViewer?.();
        },
      },
      laptop: {
        onClick: () => {},
      },
    }),
    [onOpenImageViewer],
  );

  /**
   * raycast로 확정된 mesh 이름을 interaction target으로 정규화한 뒤 click action을 실행합니다.
   */
  const handleMeshClick = useCallback(
    (mesh: Object3D) => {
      const target = resolveInteractionTarget(mesh);

      if (!target) return;

      interactionActions[target].onClick();
    },
    [interactionActions],
  );

  return {
    handleMeshClick,
  };
};

const BASS_MESH_NAMES = new Set([
  'bass_body',
  'bass_stand',
  'bass_neck',
  'bass_bridge',
  'bass_peg',
  'bass_nut',
  'line1',
  'line2',
  'line3',
  'line4',
]);

/**
 * 실제 mesh 이름을 interaction 액션에서 쓰는 도메인 target으로 정규화합니다.
 */
const resolveInteractionTarget = (mesh: Object3D | null): InteractionTarget => {
  if (!mesh) return null;
  if (mesh.name === 'laptop' || mesh.name === 'laptop_cover') return 'laptop';
  if (BASS_MESH_NAMES.has(mesh.name)) return 'bass';
  if (mesh.name === 'camera' || mesh.name.startsWith('camera_')) return 'camera';

  return null;
};
