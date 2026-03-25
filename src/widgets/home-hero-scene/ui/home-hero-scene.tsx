'use client';

import React, { useRef } from 'react';
import { css } from 'styled-system/css';

import type { ProjectListItem } from '@/entities/project/model/types';
import { HomeHeroStage } from '@/widgets/home-hero-scene/ui/home-hero-stage';
import { HomeHeroWebUi } from '@/widgets/home-hero-scene/ui/home-hero-web-ui';

type HomeHeroSceneProps = {
  readonly items: ProjectListItem[];
  readonly title: string;
  readonly triggerRef?: React.RefObject<HTMLElement | null>;
};

/** 홈 첫 화면의 모션 히어로 영역입니다. */
export const HomeHeroScene = ({ items, title, triggerRef }: HomeHeroSceneProps) => {
  const localSectionRef = useRef<HTMLElement>(null);
  const webUiRef = useRef<HTMLDivElement>(null);
  const sectionRef = triggerRef ?? localSectionRef;

  return (
    <section className={sectionClass} ref={sectionRef}>
      <HomeHeroStage triggerRef={sectionRef} webUiRef={webUiRef} />
      <HomeHeroWebUi items={items} title={title} wrapperRef={webUiRef} />
    </section>
  );
};

const sectionClass = css({
  position: 'relative',
  width: 'full',
  minHeight: '[100dvh]',
  height: '[100dvh]',
  overflow: 'clip',
  isolation: 'isolate',
  _tabletDown: {
    width: '[100vw]',
    minHeight: 'svh',
    height: 'svh',
    marginInline: '[calc(50% - 50vw)]',
  },
});
