'use client';

import { useEffect } from 'react';

import { preloadSceneGlbs } from '@/entities/scene/model/preloadGLB';

/**
 * 클라이언트에서만 씬 GLB의 HTTP 캐시를 미리 데웁니다.
 *
 * 예전에는 `useGLTF.preload`로 파싱까지 끝냈지만, GLB 텍스처가 KTX2로 바뀌면서 파싱에
 * 실제 `WebGLRenderer`가 필요해졌습니다(KTX2Loader는 transcode 대상 포맷을 렌더러에 질의합니다).
 * 이 컴포넌트는 `<Canvas>` 밖에 있어 렌더러가 없으므로, 여기서 파싱까지 하려면 감지 전용
 * WebGL 컨텍스트를 하나 더 만들어야 합니다 — 3D를 쓰지 않는 라우트에서까지 컨텍스트를
 * 낭비하게 되므로 그러지 않습니다.
 *
 * 대신 바이트만 받아 둡니다. 전체 비용의 대부분은 다운로드이고, `/models`는 immutable이라
 * 캔버스가 실제로 로드할 때 네트워크를 다시 타지 않습니다.
 *
 * 3D를 렌더하는 라우트의 **레이아웃**에서만 마운트해야 합니다. 루트 레이아웃에 두면 3D를
 * 쓰지 않는 라우트까지 GLB를 통째로 받고, 반대로 페이지 컴포넌트 안에 두면 그 페이지의
 * 데이터 조회가 끝날 때까지 프리페치가 시작되지 않습니다.
 */
export const SceneAssetPreloader = () => {
  useEffect(() => {
    preloadSceneGlbs(path => {
      void fetch(path).catch(() => {
        // 프리페치 실패는 무시한다. 실제 로드는 캔버스가 다시 시도한다.
      });
    });
  }, []);

  return null;
};
