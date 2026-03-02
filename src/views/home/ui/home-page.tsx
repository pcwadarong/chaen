'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import type { Project } from '@/entities/project/model/types';
import { ContactStrip } from '@/widgets/contact-strip/ui/contact-strip';
import { HomeHeroScene } from '@/widgets/home-hero-scene/ui/home-hero-scene';

type HomePageProps = {
  items: Project[];
};

/** 홈 화면의 실제 페이지 컨테이너입니다. */
export const HomePage = ({ items }: HomePageProps) => {
  const t = useTranslations('Home');

  return (
    <main style={pageStyle}>
      <HomeHeroScene
        description={t('showcaseScreenReaderDescription')}
        items={items}
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
