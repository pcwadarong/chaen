'use client';

import { css } from '@emotion/react';
import React, { useRef } from 'react';

import type { Project } from '@/entities/project/model/types';
import { HomeHeroStage } from '@/widgets/home-hero-scene/ui/home-hero-stage';
import { HomeHeroWebUi } from '@/widgets/home-hero-scene/ui/home-hero-web-ui';

type HomeHeroSceneProps = {
  readonly items: Project[];
  readonly title: string;
  readonly triggerRef?: React.RefObject<HTMLElement | null>;
};

/** 홈 첫 화면의 모션 히어로 영역입니다. */
export const HomeHeroScene = ({ items, title, triggerRef }: HomeHeroSceneProps) => {
  const localSectionRef = useRef<HTMLElement>(null);
  const webUiRef = useRef<HTMLDivElement>(null);
  const sectionRef = triggerRef ?? localSectionRef;

  return (
    <section ref={sectionRef} css={sectionStyle}>
      <HomeHeroStage triggerRef={sectionRef} webUiRef={webUiRef} />
      <HomeHeroWebUi items={items} title={title} wrapperRef={webUiRef} />
    </section>
  );
};

const sectionStyle = css`
  position: relative;
  width: 100vw;
  min-height: 100svh;
  height: 100svh;
  margin-inline: calc(50% - 50vw);
  overflow: clip;
  isolation: isolate;
`;
