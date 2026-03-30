'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';
import { css } from 'styled-system/css';

import { getContactSceneRenderQuality } from '@/entities/scene/model/scene-render-quality';
import { SceneBrowserFallback } from '@/entities/scene/ui/scene-browser-fallback';
import { SceneLoadingShell } from '@/entities/scene/ui/scene-loading-shell';
import { useSceneWebglAvailability } from '@/shared/lib/dom/use-scene-webgl-availability';
import {
  CONTACT_SCENE_LAYOUT_MODE,
  getContactSceneLayoutMode,
} from '@/widgets/contact-scene/model/contact-scene-layout-mode';
import { ContactStrip } from '@/widgets/contact-strip/ui/contact-strip';
import { getHomeHeroViewportMetrics } from '@/widgets/home-hero-scene/model/home-hero-viewport-metrics';
import { useBreakpoint } from '@/widgets/home-hero-scene/model/use-breakpoint';

const ContactSceneCanvas = dynamic(
  () =>
    import('@/widgets/contact-scene/ui/contact-scene-canvas').then(
      module => module.ContactSceneCanvas,
    ),
  { ssr: false, loading: () => <SceneLoadingShell className={contactCanvasLoadingClass} /> },
);

const APP_SCROLL_VIEWPORT_SELECTOR = '[data-app-scroll-viewport="true"]';

/**
 * contact가 속한 실제 scroll viewport 기준으로 contact scene의 가용 높이를 읽습니다.
 * home hero가 이미 동기화한 CSS 변수가 있으면 우선 사용하고, 없을 때만 동일 계산을 다시 수행합니다.
 */
const readContactAvailableHeight = () => {
  if (typeof window === 'undefined') return 0;

  const viewportElement = document.querySelector<HTMLElement>(APP_SCROLL_VIEWPORT_SELECTOR);
  const styleScope = viewportElement ?? document.documentElement;
  const syncedAvailableHeight =
    parseFloat(getComputedStyle(styleScope).getPropertyValue('--home-hero-available-height')) || 0;

  if (syncedAvailableHeight > 0) return syncedAvailableHeight;

  const navHeight =
    parseFloat(getComputedStyle(styleScope).getPropertyValue('--global-nav-height')) || 0;
  const viewportHeight =
    viewportElement?.clientHeight && viewportElement.clientHeight > 0
      ? viewportElement.clientHeight
      : window.innerHeight;

  return getHomeHeroViewportMetrics({
    navHeight,
    viewportHeight,
  }).availableHeight;
};

/** wide viewport에서는 좌측 contact copy와 우측 캐릭터 씬을 함께 렌더링합니다. */
export const ContactScene = () => {
  const t = useTranslations('SceneFallback');
  const { sceneViewportMode, viewportWidth } = useBreakpoint();
  const isWebglAvailable = useSceneWebglAvailability();
  const [isMounted, setIsMounted] = useState(false);
  const [availableHeight, setAvailableHeight] = useState(() => readContactAvailableHeight());
  const renderQuality = React.useMemo(
    () =>
      getContactSceneRenderQuality({
        viewportWidth,
      }),
    [viewportWidth],
  );

  useEffect(() => {
    setIsMounted(true);

    if (typeof window === 'undefined') return;

    const syncAvailableHeight = () => {
      setAvailableHeight(readContactAvailableHeight());
    };

    syncAvailableHeight();
    window.addEventListener('resize', syncAvailableHeight);

    return () => {
      window.removeEventListener('resize', syncAvailableHeight);
    };
  }, []);

  const layoutMode = getContactSceneLayoutMode({
    availableHeight,
    sceneViewportMode,
  });
  const shouldRenderScene = isMounted && layoutMode !== CONTACT_SCENE_LAYOUT_MODE.hidden;

  if (!shouldRenderScene) return null;

  if (layoutMode === CONTACT_SCENE_LAYOUT_MODE.centeredCopy) {
    return (
      <div className={wrapperClass}>
        <div className={compactLayoutClass} data-testid="contact-scene-layout">
          <div className={compactCopyClass} data-testid="contact-scene-copy">
            <ContactStrip layout="centered" />
          </div>
        </div>
        <div className={backgroundClass}>
          <div className={backgroundInnerClass}>
            <div aria-hidden="true" className={backgroundGradientClass} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <div className={layoutClass} data-testid="contact-scene-layout">
        <div className={copyColumnClass} data-testid="contact-scene-copy">
          <ContactStrip layout="split" />
        </div>
        <div aria-hidden="true" className={mediaColumnClass} data-testid="contact-scene-media">
          <div className={canvasFrameClass}>
            {isWebglAvailable === false ? (
              <SceneBrowserFallback
                className={contactCanvasLoadingClass}
                description={t('webglDescription')}
                title={t('webglTitle')}
              />
            ) : isWebglAvailable === null ? (
              <SceneLoadingShell className={contactCanvasLoadingClass} />
            ) : (
              <ContactSceneCanvas renderQuality={renderQuality} />
            )}
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
  _desktopUp: {
    marginTop: '[calc(-1 * var(--global-nav-height, 0px))]',
    minHeight: '[var(--home-hero-viewport-height, 100dvh)]',
  },
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
  paddingLeft: '8',
  _desktopUp: {
    minHeight: '[var(--home-hero-viewport-height, 100dvh)]',
  },
});

const compactLayoutClass = css({
  position: 'relative',
  zIndex: '2',
  width: 'full',
  maxWidth: 'contentWide',
  mx: 'auto',
  minHeight: '[var(--home-hero-available-height, 100dvh)]',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingLeft: '6',
  paddingRight: '6',
  _desktopUp: {
    minHeight: '[var(--home-hero-viewport-height, 100dvh)]',
  },
});

const copyColumnClass = css({
  position: 'relative',
  zIndex: '2',
  flex: '[0 1 clamp(var(--sizes-contact-copy-min), 34vw, var(--sizes-contact-copy-max))]',
});

const compactCopyClass = css({
  position: 'relative',
  zIndex: '2',
  width: 'full',
  display: 'flex',
  justifyContent: 'center',
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
  _desktopUp: {
    height: '[var(--home-hero-viewport-height, 100dvh)]',
  },
});

const canvasFrameClass = css({
  width: 'full',
  height: 'full',
});

const contactCanvasLoadingClass = css({
  background:
    '[radial-gradient(circle_at_70%_45%, rgba(255,245,232,0.32), transparent 52%), radial-gradient(circle_at_88%_86%, rgba(255,255,255,0.28), transparent 24%)]',
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
  _desktopUp: {
    minHeight: '[var(--home-hero-viewport-height, 100dvh)]',
  },
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
