'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { css, cx } from 'styled-system/css';

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
  const { currentBP, sceneMode } = useBreakpoint();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const shouldRenderDesktopScene = isMounted && sceneMode === 'desktop';
  const isDesktopSmall = currentBP === 3;

  if (!shouldRenderDesktopScene) {
    return null;
  }

  return (
    <div className={wrapperClass}>
      <div aria-hidden="true" className={canvasFrameClass}>
        <ContactSceneCanvas currentBP={currentBP} />
      </div>
      <div className={overlayClass}>
        <div
          className={cx(
            overlayInnerClass,
            isDesktopSmall ? overlayInnerDesktopSmallClass : undefined,
          )}
        >
          <ContactStrip />
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

const canvasFrameClass = css({
  position: 'absolute',
  inset: '0',
  pointerEvents: 'none',
  zIndex: '1',
});

const overlayClass = css({
  position: 'relative',
  zIndex: '2',
  width: 'full',
  minHeight: '[inherit]',
});

const overlayInnerClass = css({
  width: 'full',
  maxWidth: 'contentWide',
  mx: 'auto',
  minHeight: '[var(--home-hero-available-height, 100dvh)]',
  display: 'grid',
  gridTemplateColumns:
    '[minmax(var(--sizes-contact-copy-min), var(--sizes-contact-copy-max)) minmax(0, 1fr)]',
  alignItems: 'center',
  columnGap: '[clamp(2rem, 6vw, 5rem)]',
  px: '4',
});

const overlayInnerDesktopSmallClass = css({
  paddingLeft: '8',
  paddingRight: '5',
});
