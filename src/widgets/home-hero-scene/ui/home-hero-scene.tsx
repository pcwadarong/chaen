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
  const blackoutOverlayRef = useRef<HTMLDivElement>(null);
  const sectionRef = triggerRef ?? localSectionRef;

  return (
    <section className={sectionClass} id="scene-scroll-container" ref={sectionRef}>
      <HomeHeroStage
        blackoutOverlayRef={blackoutOverlayRef}
        triggerRef={sectionRef}
        webUiRef={webUiRef}
      />
      <HomeHeroWebUi items={items} title={title} wrapperRef={webUiRef} />
      <div aria-hidden="true" className={blackoutOverlayClass} ref={blackoutOverlayRef} />
    </section>
  );
};

const sectionClass = css({
  position: 'relative',
  width: 'full',
  minHeight: '[calc(100dvh - var(--global-nav-height, 0px))]',
  height: '[calc(100dvh - var(--global-nav-height, 0px))]',
  overflow: 'clip',
  isolation: 'isolate',
  _desktopUp: {
    minHeight: '[calc(100dvh - 2.5rem - var(--global-nav-height, 0px))]',
    height: '[calc(100dvh - 2.5rem - var(--global-nav-height, 0px))]',
  },
  _tabletDown: {
    width: '[100vw]',
    minHeight: '[calc(100svh - var(--global-nav-height, 0px))]',
    height: '[calc(100svh - var(--global-nav-height, 0px))]',
    marginInline: '[calc(50% - 50vw)]',
  },
});

const blackoutOverlayClass = css({
  position: 'fixed',
  inset: '0',
  zIndex: '3',
  pointerEvents: 'none',
  opacity: '0',
  backgroundColor: 'black',
});
