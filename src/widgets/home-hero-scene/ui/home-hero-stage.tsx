'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { css } from 'styled-system/css';

import { SceneBrowserFallback } from '@/entities/scene/ui/scene-browser-fallback';
import { useSceneWebglAvailability } from '@/shared/lib/dom/use-scene-webgl-availability';
import { HOME_HERO_STAGE_BACKGROUND } from '@/widgets/home-hero-scene/model/home-hero-scene-theme';
import type {
  HomeHeroStageCanvasProps,
  HomeHeroStageProps,
} from '@/widgets/home-hero-scene/model/home-hero-stage-contract';
import { useHomeHeroSceneScrollLock } from '@/widgets/home-hero-scene/model/use-home-hero-scene-scroll-lock';
import { HomeHeroStageLoadingProgressBridge } from '@/widgets/home-hero-scene/ui/home-hero-stage-loading-bridge';
import { HomeHeroStageLoadingOverlay } from '@/widgets/home-hero-scene/ui/home-hero-stage-loading-overlay';

const HomeHeroStageCanvas = dynamic<HomeHeroStageCanvasProps>(
  () =>
    import('@/widgets/home-hero-scene/ui/home-hero-stage-canvas').then(
      module => module.HomeHeroStageCanvas,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

/**
 * 홈 히어로 영역의 3D 캔버스 프레임과 로딩 폴백을 제공합니다.
 */
export const HomeHeroStage = ({ content, interaction, sceneRefs }: HomeHeroStageProps) => {
  const t = useTranslations('SceneFallback');
  const isWebglAvailable = useSceneWebglAvailability();
  const [isSceneAssetLoading, setIsSceneAssetLoading] = useState(true);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [, setSceneLoadingProgress] = useState(0);
  const shouldShowLoadingOverlay =
    isWebglAvailable === null ||
    (isWebglAvailable === true && (isSceneAssetLoading || !isSceneReady));

  useHomeHeroSceneScrollLock(shouldShowLoadingOverlay);

  return (
    <div className={stageFrameClass}>
      {isWebglAvailable === false ? (
        <SceneBrowserFallback
          className={stageFallbackClass}
          description={t('webglDescription')}
          title={t('webglTitle')}
        />
      ) : isWebglAvailable === null ? (
        <HomeHeroStageLoadingOverlay
          className={stageLoadingOverlayClass}
          srLabel="Loading 3D scene"
        />
      ) : (
        <>
          <HomeHeroStageLoadingProgressBridge
            onLoadingChange={setIsSceneAssetLoading}
            onProgressChange={setSceneLoadingProgress}
          />
          <HomeHeroStageCanvas
            content={content}
            interaction={interaction}
            onSceneReadyChange={setIsSceneReady}
            sceneRefs={sceneRefs}
          />
          {shouldShowLoadingOverlay ? (
            <HomeHeroStageLoadingOverlay
              className={stageLoadingOverlayClass}
              srLabel="Loading 3D scene"
            />
          ) : null}
        </>
      )}
    </div>
  );
};

const stageFrameClass = css({
  position: 'absolute',
  inset: '0',
  overflow: 'hidden',
  backgroundColor: `[${HOME_HERO_STAGE_BACKGROUND}]`,
  border: '[1px solid var(--colors-border)]',
  boxShadow: 'floating',
});

const stageFallbackClass = css({
  width: 'full',
  height: 'full',
  backgroundColor: `[${HOME_HERO_STAGE_BACKGROUND}]`,
});

const stageLoadingOverlayClass = css({
  background:
    '[linear-gradient(180deg, color-mix(in srgb, #5d5bff 88%, white) 0%, color-mix(in srgb, #5d5bff 94%, black) 100%)]',
});
