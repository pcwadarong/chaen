'use client';

import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useState } from 'react';
import { css } from 'styled-system/css';

import { SCENE_VIEWPORT_MODE } from '@/entities/scene/model/breakpointConfig';
import { XButton } from '@/shared/ui/x-button/x-button';
import { useBreakpoint } from '@/widgets/home-hero-scene/model/use-breakpoint';

type HomeHeroInteractionHintProps = Readonly<{
  readonly hidden?: boolean;
}>;

const HOME_HERO_INTERACTION_HINT_STORAGE_KEY = 'home-hero:interaction-hint-dismissed';

/**
 * 홈 첫 진입 시 현재 viewport 모드에 맞는 상호작용 안내 문구를 노출합니다.
 * 사용자가 한 번 닫으면 localStorage에 기록해 이후 방문에서는 다시 열지 않습니다.
 */
export const HomeHeroInteractionHint = ({ hidden = false }: HomeHeroInteractionHintProps) => {
  const t = useTranslations('HomeHeroHint');
  const { sceneViewportMode } = useBreakpoint();
  const [isDismissed, setIsDismissed] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    if (typeof window === 'undefined') return;

    try {
      setIsDismissed(
        window.localStorage.getItem(HOME_HERO_INTERACTION_HINT_STORAGE_KEY) === 'true',
      );
    } catch {
      setIsDismissed(false);
    }
  }, []);

  /**
   * 현재 기기에서 더 이상 초기 안내 문구를 반복 노출하지 않도록 닫힘 상태를 저장합니다.
   */
  const handleDismiss = useCallback(() => {
    setIsDismissed(true);

    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(HOME_HERO_INTERACTION_HINT_STORAGE_KEY, 'true');
    } catch {
      // storage 접근이 막힌 환경에서는 현재 세션 동안만 닫힌 상태를 유지합니다.
    }
  }, []);

  if (!isHydrated || isDismissed || hidden) return null;

  const text = sceneViewportMode === SCENE_VIEWPORT_MODE.wide ? t('wideText') : t('stackedText');

  return (
    <aside aria-label={t('ariaLabel')} className={wrapperClass} role="note">
      <div className={cardClass}>
        <p className={textClass}>{text}</p>
        <XButton
          ariaLabel={t('closeAriaLabel')}
          className={closeButtonClass}
          onClick={handleDismiss}
          size="sm"
          tone="white"
          variant="ghost"
        />
      </div>
    </aside>
  );
};

const wrapperClass = css({
  position: 'absolute',
  insetInline: '0',
  bottom: '4',
  zIndex: '4',
  display: 'flex',
  justifyContent: 'center',
  paddingInline: '4',
  pointerEvents: 'none',
  _desktopUp: {
    bottom: '6',
  },
});

const cardClass = css({
  position: 'relative',
  width: 'full',
  maxWidth: '2xl',
  display: 'flex',
  alignItems: 'center',
  borderRadius: '2xl',
  bg: 'surface',
  color: 'text',
  boxShadow: 'floating',
  backdropBlur: 'md',
  paddingInline: '5',
  paddingBlock: '4',
  paddingInlineEnd: '12',
  pointerEvents: 'auto',
});

const textClass = css({
  textStyle: 'xs',
  lineHeight: 'relaxed',
  color: 'muted',
});

const closeButtonClass = css({
  position: 'absolute',
  top: '2',
  right: '2',
});
