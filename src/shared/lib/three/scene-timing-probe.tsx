'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

import { markSceneFirstContentFrame, markSceneFirstFrame } from '@/shared/lib/three/scene-timing';

type SceneTimingProbeProps = {
  /**
   * `true`면 씬 내용이 그려진 첫 프레임으로 기록합니다.
   * Suspense 안쪽(GLB가 준비된 뒤 마운트되는 자리)에 둔 인스턴스만 이 값을 켭니다.
   */
  readonly isContent?: boolean;
};

/**
 * 씬이 처음 렌더된 프레임에 `performance.mark`를 남깁니다. 화면에는 아무것도 그리지 않습니다.
 *
 * `<Canvas>` 안에 있어야 합니다 — `useFrame`은 실제로 그려지는 프레임에서만 돌기 때문에
 * "로드가 끝난 시점"이 아니라 "화면에 나온 시점"을 잡을 수 있습니다.
 * 남긴 mark는 DevTools Performance 패널 타임라인에 그대로 표시되므로 별도 집계는 두지 않습니다.
 */
export const SceneTimingProbe = ({ isContent = false }: SceneTimingProbeProps) => {
  const hasMarkedRef = useRef(false);

  useFrame(() => {
    if (hasMarkedRef.current) return;

    hasMarkedRef.current = true;

    if (isContent) {
      markSceneFirstContentFrame();

      return;
    }

    markSceneFirstFrame();
  });

  return null;
};
