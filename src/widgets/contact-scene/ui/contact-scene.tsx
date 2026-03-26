'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { css } from 'styled-system/css';

import { ContactStrip } from '@/widgets/contact-strip/ui/contact-strip';
import { useBreakpoint } from '@/widgets/home-hero-scene/model/use-breakpoint';

const ContactSceneCanvas = dynamic(
  () =>
    import('@/widgets/contact-scene/ui/contact-scene-canvas').then(
      module => module.ContactSceneCanvas,
    ),
  { ssr: false, loading: () => null },
);

/** 데스크탑에서는 R3F 캔버스와 ContactStrip을 합쳐 렌더링합니다. 모바일에서는 ContactStrip만 표시합니다. */
export const ContactScene = () => {
  const { sceneMode } = useBreakpoint();
  const shouldRenderCanvas = sceneMode === 'desktop';

  return (
    <div className={wrapperClass}>
      {shouldRenderCanvas ? (
        <div aria-hidden="true" className={canvasFrameClass}>
          <ContactSceneCanvas />
        </div>
      ) : null}
      <div className={overlayClass}>
        <ContactStrip />
      </div>
    </div>
  );
};

const wrapperClass = css({
  position: 'relative',
  width: 'full',
  minHeight: '[clamp(22rem, 50svh, 36rem)]',
});

const canvasFrameClass = css({
  position: 'absolute',
  inset: '0',
  pointerEvents: 'none',
});

const overlayClass = css({
  position: 'relative',
  zIndex: '1',
  width: 'full',
});
