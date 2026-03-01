'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import { projectItems } from '@/entities/project/model/project-items';
import { ContactStrip } from '@/widgets/contact-strip/ui/contact-strip';
import { HomeHeroScene } from '@/widgets/home-hero-scene/ui/home-hero-scene';

/** 홈 화면의 실제 페이지 컨테이너입니다. */
export const HomePage = () => {
  const t = useTranslations('Home');
  const featuredItems = projectItems.slice(0, 3);

  return (
    <main style={pageStyle}>
      <HomeHeroScene
        description={t('showcaseDescription')}
        items={featuredItems}
        title={t('showcaseTitle')}
      />
      <ContactStrip />
    </main>
  );
};

const pageStyle: CSSProperties = {
  width: '100%',
  display: 'grid',
  gap: '0',
};
