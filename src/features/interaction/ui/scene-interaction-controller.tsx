'use client';

import { useThree } from '@react-three/fiber';
import React, { useEffect } from 'react';

import { useInteractionActions } from '@/features/interaction/model/useInteractionActions';
import { useRaycaster } from '@/features/interaction/model/useRaycaster';
import { OutlineEffect } from '@/features/interaction/ui/outline-effect';

type SceneInteractionControllerProps = Readonly<{
  onBrowseProjects?: () => void;
  onOpenImageViewer?: () => void;
}>;

/**
 * canvas DOM 포인터 이벤트와 3D interaction 훅을 연결합니다.
 * hit test, hover 액션, click 액션, outline 렌더를 한 곳에서 조합합니다.
 */
export const SceneInteractionController = ({
  onBrowseProjects,
  onOpenImageViewer,
}: SceneInteractionControllerProps) => {
  const { gl } = useThree();
  const { hoveredOutlineMeshes, onPointerClick, onPointerMove, clearHoveredMesh } = useRaycaster({
    onMeshClick: mesh => {
      handleMeshClick(mesh);
    },
  });
  const { handleMeshClick } = useInteractionActions({
    onBrowseProjects,
    onOpenImageViewer,
  });

  useEffect(() => {
    const canvasElement = gl.domElement;
    const handlePointerMove = (event: PointerEvent) => {
      onPointerMove(event);
    };
    const handlePointerDownOrUp = (event: PointerEvent) => {
      onPointerClick(event);
    };
    const handlePointerLeave = () => {
      clearHoveredMesh();
    };

    canvasElement.addEventListener('pointermove', handlePointerMove);
    canvasElement.addEventListener('pointerdown', handlePointerDownOrUp);
    canvasElement.addEventListener('pointerup', handlePointerDownOrUp);
    canvasElement.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      canvasElement.removeEventListener('pointermove', handlePointerMove);
      canvasElement.removeEventListener('pointerdown', handlePointerDownOrUp);
      canvasElement.removeEventListener('pointerup', handlePointerDownOrUp);
      canvasElement.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [clearHoveredMesh, gl, onPointerClick, onPointerMove]);

  return <OutlineEffect hoveredMeshes={hoveredOutlineMeshes} />;
};
