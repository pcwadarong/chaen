import { useTranslations } from 'next-intl';
import React from 'react';
import { css } from 'styled-system/css';

import { HomeHeroStageLoadingOverlay } from '@/widgets/home-hero-scene/ui/home-hero-stage-loading-overlay';

/**
 * 홈 라우트는 locale 전역 fallback 대신 씬 로더와 같은 비주얼을 먼저 노출합니다.
 */
const HomeLoading = () => {
  const t = useTranslations('Common');

  return (
    <main className={pageClass}>
      <HomeHeroStageLoadingOverlay className={overlayClass} srLabel={t('pageLoading')} />
    </main>
  );
};

export default HomeLoading;

const pageClass = css({
  position: 'relative',
  minHeight: 'svh',
  backgroundColor: '[#5d5bff]',
});

const overlayClass = css({
  position: 'fixed',
});
