'use client';

import { useEffect, useState } from 'react';

/**
 * 현재 브라우저가 기본 WebGL 컨텍스트를 만들 수 있는지 판별합니다.
 * 3D 씬을 마운트하기 전에 지원 여부를 먼저 확인해 unsupported 브라우저에서는
 * Canvas 대신 대체 안내 UI를 안정적으로 노출하는 용도입니다.
 *
 * @returns 아직 판별 전이면 `null`, WebGL 사용 가능이면 `true`, 불가능하면 `false`
 */
export const useSceneWebglAvailability = () => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const canvas = document.createElement('canvas');

    try {
      const context =
        canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl');

      setIsAvailable(Boolean(context));
    } catch {
      setIsAvailable(false);
    }
  }, []);

  return isAvailable;
};
