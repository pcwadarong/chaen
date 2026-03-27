'use client';

import { useFrame, useThree } from '@react-three/fiber';
import {
  EffectComposer,
  EffectPass,
  OutlineEffect as OutlineEffectImpl,
  RenderPass,
} from 'postprocessing';
import { useEffect, useRef } from 'react';
import type { Object3D } from 'three';

import { useIsTouchDevice } from '@/shared/lib/dom/use-is-touch-device';

const OUTLINE_EDGE_COLOR = 0xffffff;
const OUTLINE_EDGE_STRENGTH = 3;

type OutlineEffectProps = Readonly<{
  hoveredMeshes: Object3D[];
}>;

/**
 * fine pointer 환경에서 현재 hover된 mesh만 후처리 outline로 강조합니다.
 * coarse pointer 환경은 성능과 UX 기준으로 outline을 렌더하지 않습니다.
 * postprocessing 라이브러리를 직접 사용해 @react-three/postprocessing의 R3F v9 호환성 문제를 우회합니다.
 */
export const OutlineEffect = ({ hoveredMeshes }: OutlineEffectProps) => {
  const isTouchDevice = useIsTouchDevice();
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const outlineRef = useRef<OutlineEffectImpl | null>(null);

  useEffect(() => {
    if (isTouchDevice) return;

    const outline = new OutlineEffectImpl(scene, camera, {
      edgeStrength: OUTLINE_EDGE_STRENGTH,
      hiddenEdgeColor: OUTLINE_EDGE_COLOR,
      visibleEdgeColor: OUTLINE_EDGE_COLOR,
    });
    const composer = new EffectComposer(gl);

    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new EffectPass(camera, outline));
    composer.setSize(size.width, size.height);

    composerRef.current = composer;
    outlineRef.current = outline;

    return () => {
      composer.dispose();
      composerRef.current = null;
      outlineRef.current = null;
    };
    // size는 resize useEffect에서 별도 처리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera, isTouchDevice]);

  useEffect(() => {
    composerRef.current?.setSize(size.width, size.height);
  }, [size]);

  useEffect(() => {
    const outline = outlineRef.current;

    if (!outline) return;

    if (hoveredMeshes.length > 0) {
      outline.selection.set(hoveredMeshes);
    } else {
      outline.selection.clear();
    }
  }, [hoveredMeshes]);

  useFrame((state, delta) => {
    if (composerRef.current) {
      composerRef.current.render(delta);
    } else {
      state.gl.render(state.scene, state.camera);
    }
  }, 1);

  return null;
};
