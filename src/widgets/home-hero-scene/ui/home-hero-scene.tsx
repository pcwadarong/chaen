'use client';

import React, { type CSSProperties } from 'react';

import { HomeHeroStage } from '@/widgets/home-hero-scene/ui/home-hero-stage';

/** 홈 첫 화면의 모션 히어로 영역입니다. */
export const HomeHeroScene = () => (
  <section style={sectionStyle}>
    <HomeHeroStage />
  </section>
);

const sectionStyle: CSSProperties = {
  position: 'relative',
  width: '100vw',
  minHeight: 'clamp(42rem, 88vh, 58rem)',
  marginInline: 'calc(50% - 50vw)',
  overflow: 'clip',
  isolation: 'isolate',
};
