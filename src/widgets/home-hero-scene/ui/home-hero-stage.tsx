'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import React from 'react';
import { css } from 'styled-system/css';

import { SceneBrowserFallback } from '@/entities/scene/ui/scene-browser-fallback';
import { SceneLoadingShell } from '@/entities/scene/ui/scene-loading-shell';
import { useSceneWebglAvailability } from '@/shared/lib/dom/use-scene-webgl-availability';
import { HOME_HERO_STAGE_BACKGROUND } from '@/widgets/home-hero-scene/model/home-hero-scene-theme';
import type { HomeHeroStageProps } from '@/widgets/home-hero-scene/model/home-hero-stage-contract';

const HomeHeroStageCanvas = dynamic<HomeHeroStageProps>(
  () =>
    import('@/widgets/home-hero-scene/ui/home-hero-stage-canvas').then(
      module => module.HomeHeroStageCanvas,
    ),
  {
    ssr: false,
    loading: () => <SceneLoadingShell className={stageFallbackClass} />,
  },
);

/**
 * 홈 히어로 영역의 3D 캔버스 프레임과 로딩 폴백을 제공합니다.
 */
export const HomeHeroStage = ({ content, interaction, sceneRefs }: HomeHeroStageProps) => {
  const t = useTranslations('SceneFallback');
  const isWebglAvailable = useSceneWebglAvailability();

  return (
    <div className={stageFrameClass}>
      {isWebglAvailable === false ? (
        <SceneBrowserFallback
          className={stageFallbackClass}
          description={t('webglDescription')}
          title={t('webglTitle')}
        />
      ) : isWebglAvailable === null ? (
        <SceneLoadingShell className={stageFallbackClass} />
      ) : (
        <HomeHeroStageCanvas content={content} interaction={interaction} sceneRefs={sceneRefs} />
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
