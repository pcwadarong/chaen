import { useTranslations } from 'next-intl';
import React from 'react';
import { css } from 'styled-system/css';

import { ContactScene } from '@/widgets/contact-scene';
import type { HomeHeroImageViewerItem } from '@/widgets/home-hero-scene/model/home-hero-image-viewer-item';
import { HomeHeroScene } from '@/widgets/home-hero-scene/ui/home-hero-scene';

export type HomePageProps = {
  locale: string;
  photoItems: HomeHeroImageViewerItem[];
};

/** 홈 화면의 실제 페이지 컨테이너입니다. */
export const HomePage = ({ locale, photoItems }: HomePageProps) => {
  const t = useTranslations('Home');

  return (
    <main className={pageClass} data-hide-app-frame-footer="true">
      <HomeHeroScene locale={locale} photoItems={photoItems} title={t('showcaseTitle')} />
      <ContactScene />
    </main>
  );
};

const pageClass = css({
  width: 'full',
  display: 'grid',
  gap: '0',
  overflowX: 'clip',
});
