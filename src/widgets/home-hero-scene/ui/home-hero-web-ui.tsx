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
      <ProjectShowcase description={description} hideHeader items={items} title={title} />
    </div>
  </div>
);

const wrapperStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 2,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  padding: homeHeroWebUiLayout.overlayPadding,
  opacity: 0,
  pointerEvents: 'none',
  willChange: 'opacity, transform',
};

const gridBridgeStyle: CSSProperties = {
  width: homeHeroWebUiLayout.containerWidth,
  display: 'grid',
  paddingBottom: 'clamp(0rem, 1vh, 0.5rem)',
};
