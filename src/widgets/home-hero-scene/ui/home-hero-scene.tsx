'use client';

import React, { type CSSProperties } from 'react';
import { useRef } from 'react';

import type { ProjectItem } from '@/entities/project/model/project-items';
import { HomeHeroStage } from '@/widgets/home-hero-scene/ui/home-hero-stage';
import { HomeHeroWebUi } from '@/widgets/home-hero-scene/ui/home-hero-web-ui';

type HomeHeroSceneProps = {
  readonly description: string;
  readonly items: ProjectItem[];
  readonly title: string;
  readonly triggerRef?: React.RefObject<HTMLElement | null>;
};

/** 홈 첫 화면의 모션 히어로 영역입니다. */
export const HomeHeroScene = ({ description, items, title, triggerRef }: HomeHeroSceneProps) => {
  const localSectionRef = useRef<HTMLElement>(null);
  const webUiRef = useRef<HTMLDivElement>(null);
  const sectionRef = triggerRef ?? localSectionRef;

  return (
    <section ref={sectionRef} style={sectionStyle}>
      <HomeHeroStage triggerRef={sectionRef} webUiRef={webUiRef} />
      <HomeHeroWebUi description={description} items={items} title={title} wrapperRef={webUiRef} />
    </section>
  );
};

const sectionStyle: CSSProperties = {
  position: 'relative',
  width: '100vw',
  minHeight: '100svh',
  height: '100svh',
  marginInline: 'calc(50% - 50vw)',
  overflow: 'clip',
  isolation: 'isolate',
};
