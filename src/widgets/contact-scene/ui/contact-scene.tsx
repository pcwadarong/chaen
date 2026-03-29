'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
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

/** 데스크탑에서는 좌측 contact copy와 우측 캐릭터 씬을 함께 렌더링합니다. */
export const ContactScene = () => {
  const { sceneMode } = useBreakpoint();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const shouldRenderDesktopScene = isMounted && sceneMode === 'desktop';

  if (!shouldRenderDesktopScene) {
    return null;
  }

  return (
    <div className={wrapperClass}>
      <div className={layoutClass} data-testid="contact-scene-layout">
        <div className={copyColumnClass} data-testid="contact-scene-copy">
          <ContactStrip />
        </div>
        <div aria-hidden="true" className={mediaColumnClass} data-testid="contact-scene-media">
          <div className={canvasFrameClass}>
            <ContactSceneCanvas />
          </div>
        </div>
      </div>
      <div className={backgroundClass}>
        <div className={backgroundInnerClass}>
          <div aria-hidden="true" className={backgroundGradientClass} />
        </div>
      </div>
    </div>
  );
};

const wrapperClass = css({
  position: 'relative',
  width: 'full',
  overflow: 'clip',
  minHeight: '[var(--home-hero-available-height, 100dvh)]',
});

const layoutClass = css({
  position: 'relative',
  zIndex: '2',
  width: 'full',
  maxWidth: 'contentWide',
  mx: 'auto',
  minHeight: '[var(--home-hero-available-height, 100dvh)]',
  display: 'flex',
  alignItems: 'center',
  gap: '[clamp(2rem, 6vw, 5rem)]',
  paddingLeft: '12',
  paddingRight: '4',
});

const copyColumnClass = css({
  position: 'relative',
  zIndex: '2',
  flex: '[0 1 clamp(var(--sizes-contact-copy-min), 34vw, var(--sizes-contact-copy-max))]',
});

const mediaColumnClass = css({
  position: 'relative',
  zIndex: '1',
  flex: '1',
  minWidth: '0',
  height: '[var(--home-hero-available-height, 100dvh)]',
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'flex-end',
  pointerEvents: 'none',
});

const canvasFrameClass = css({
  width: 'full',
  height: 'full',
});

const backgroundClass = css({
  position: 'absolute',
  inset: '0',
  zIndex: '0',
  pointerEvents: 'none',
});

const backgroundInnerClass = css({
  width: 'full',
  maxWidth: 'contentWide',
  mx: 'auto',
  minHeight: '[var(--home-hero-available-height, 100dvh)]',
  paddingLeft: '12',
  paddingRight: '4',
});

const backgroundGradientClass = css({
  position: 'absolute',
  insetInline: '0',
  bottom: '0',
  top: '[clamp(1.5rem, 10vh, 6rem)]',
  background:
    '[radial-gradient(circle_at_70%_45%, rgba(255,245,232,0.78), transparent 52%), radial-gradient(circle_at_88%_86%, rgba(255,255,255,0.7), transparent 24%)]',
  opacity: '0.9',
});
