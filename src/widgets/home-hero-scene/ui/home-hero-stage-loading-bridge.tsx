'use client';

import { useProgress } from '@react-three/drei';
import { useEffect } from 'react';

const SCENE_LOADING_PROGRESS_FALLBACK = 8;
const readyBridgeTokens = new WeakMap<(isReady: boolean) => void, symbol>();

type HomeHeroStageLoadingProgressBridgeProps = Readonly<{
  onLoadingChange: (isLoading: boolean) => void;
  onProgressChange: (progress: number) => void;
}>;

type HomeHeroStageReadyBridgeProps = Readonly<{
  isReady: boolean;
  onReadyChange: (isReady: boolean) => void;
}>;

/**
 * drei loading manager 상태를 읽어 홈 씬 로더 progress와 준비 상태를 동기화합니다.
 */
export const HomeHeroStageLoadingProgressBridge = ({
  onLoadingChange,
  onProgressChange,
}: HomeHeroStageLoadingProgressBridgeProps) => {
  const { active, progress } = useProgress();

  useEffect(() => {
    const normalizedProgress = active
      ? Math.max(Math.round(progress), SCENE_LOADING_PROGRESS_FALLBACK)
      : 100;

    onLoadingChange(active);
    onProgressChange(Math.min(100, normalizedProgress));
  }, [active, onLoadingChange, onProgressChange, progress]);

  return null;
};

/**
 * Suspense 경계 안팎에서 scene object 준비 완료 여부를 부모 상태로 전달합니다.
 */
export const HomeHeroStageReadyBridge = ({
  isReady,
  onReadyChange,
}: HomeHeroStageReadyBridgeProps) => {
  useEffect(() => {
    const token = Symbol('home-hero-stage-ready-bridge');

    readyBridgeTokens.set(onReadyChange, token);
    onReadyChange(isReady);

    return () => {
      if (readyBridgeTokens.get(onReadyChange) !== token) {
        return;
      }

      readyBridgeTokens.delete(onReadyChange);
      onReadyChange(false);
    };
  }, [isReady, onReadyChange]);

  return null;
};
