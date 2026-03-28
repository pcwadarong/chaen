'use client';

import { useCallback, useMemo } from 'react';
import type { Object3D } from 'three';

type BassStringTarget = 'line1' | 'line2' | 'line3' | 'line4';
type InteractionTarget = 'bass' | 'camera' | 'laptop' | BassStringTarget | null;

type InteractionAction = Readonly<{
  onClick: () => void;
}>;

type UseInteractionActionsOptions = Readonly<{
  onBrowseProjects?: () => void;
  onOpenImageViewer?: () => void;
  onPlayBassString?: (stringName: BassStringTarget) => void | Promise<void>;
  onToggleBackgroundMusicPlayback?: () => void | Promise<void>;
}>;

/**
 * mesh 이름별 click 액션을 현재 홈 씬 요구사항에 맞춰 조합합니다.
 * laptop은 프로젝트 뷰, camera는 이미지 뷰어, bass body는 background music 토글,
 * line1~4는 줄 샘플 재생으로 연결합니다.
 */
export const useInteractionActions = ({
  onBrowseProjects,
  onOpenImageViewer,
  onPlayBassString,
  onToggleBackgroundMusicPlayback,
}: UseInteractionActionsOptions): {
  handleMeshClick: (mesh: Object3D) => void;
} => {
  const interactionActions = useMemo<Record<Exclude<InteractionTarget, null>, InteractionAction>>(
    () => ({
      bass: {
        onClick: () => {
          onToggleBackgroundMusicPlayback?.();
        },
      },
      camera: {
        onClick: () => {
          onOpenImageViewer?.();
        },
      },
      laptop: {
        onClick: () => {
          onBrowseProjects?.();
        },
      },
      line1: {
        onClick: () => {
          onPlayBassString?.('line1');
        },
      },
      line2: {
        onClick: () => {
          onPlayBassString?.('line2');
        },
      },
      line3: {
        onClick: () => {
          onPlayBassString?.('line3');
        },
      },
      line4: {
        onClick: () => {
          onPlayBassString?.('line4');
        },
      },
    }),
    [onBrowseProjects, onOpenImageViewer, onPlayBassString, onToggleBackgroundMusicPlayback],
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

const BASS_TRACK_MESH_NAMES = new Set([
  'bass_body',
  'bass_stand',
  'bass_neck',
  'bass_bridge',
  'bass_head',
  'bass_peg',
  'bass_nut',
]);
const BASS_STRING_MESH_NAMES = new Set<BassStringTarget>(['line1', 'line2', 'line3', 'line4']);

/**
 * 실제 mesh 이름을 interaction 액션에서 쓰는 도메인 target으로 정규화합니다.
 */
const resolveInteractionTarget = (mesh: Object3D | null): InteractionTarget => {
  if (!mesh) return null;
  if (mesh.name === 'laptop' || mesh.name === 'laptop_cover') return 'laptop';
  if (BASS_STRING_MESH_NAMES.has(mesh.name as BassStringTarget))
    return mesh.name as BassStringTarget;
  if (BASS_TRACK_MESH_NAMES.has(mesh.name)) return 'bass';
  if (mesh.name === 'camera' || mesh.name.startsWith('camera_')) return 'camera';

  return null;
};
