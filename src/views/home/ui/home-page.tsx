import { useTranslations } from 'next-intl';
import React from 'react';
import { css } from 'styled-system/css';

import type { ProjectListItem } from '@/entities/project/model/types';
import { ContactScene } from '@/widgets/contact-scene';
import { HomeHeroScene } from '@/widgets/home-hero-scene/ui/home-hero-scene';

export type HomePageProps = {
  items: ProjectListItem[];
};

/** 홈 화면의 실제 페이지 컨테이너입니다. */
export const HomePage = ({ items }: HomePageProps) => {
  const t = useTranslations('Home');

  return (
    <main className={pageClass} data-hide-app-frame-footer-mobile="true">
      <HomeHeroScene items={items} title={t('showcaseTitle')} />
      <ContactScene />
    </main>
  );
};

const pageClass = css({
  width: 'full',
  display: 'grid',
  gap: '0',
});
