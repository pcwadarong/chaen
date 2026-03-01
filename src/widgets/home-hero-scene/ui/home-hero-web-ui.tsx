'use client';

import React, { type CSSProperties } from 'react';

import type { ProjectItem } from '@/entities/project/model/project-items';
import { homeHeroWebUiLayout } from '@/widgets/home-hero-scene/model/home-hero-web-ui-layout';
import { ProjectShowcase } from '@/widgets/project-showcase/ui/project-showcase';

type HomeHeroWebUiProps = {
  readonly description: string;
  readonly items: ProjectItem[];
  readonly title: string;
  readonly wrapperRef?: React.RefObject<HTMLDivElement | null>;
};

/** 3D 캔버스 위에서 페이드 인되는 실제 HTML UI 레이어입니다. */
export const HomeHeroWebUi = ({ description, items, title, wrapperRef }: HomeHeroWebUiProps) => (
  <div id="web-ui" ref={wrapperRef} style={wrapperStyle}>
    <div style={gridBridgeStyle}>
      <div style={contentStyle}>
        <ProjectShowcase description={description} hideHeader items={items} title={title} />
      </div>
    </div>
  </div>
);

const wrapperStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 2,
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'center',
  padding: 'clamp(4.5rem, 8vh, 6rem) 0 clamp(2rem, 5vh, 3rem)',
  opacity: 0,
  pointerEvents: 'none',
  willChange: 'opacity, transform',
};

const gridBridgeStyle: CSSProperties = {
  width: '100%',
  minHeight: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const contentStyle: CSSProperties = {
  width: homeHeroWebUiLayout.containerWidth,
};
