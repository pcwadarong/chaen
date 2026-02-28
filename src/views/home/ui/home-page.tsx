'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import { projectItems } from '@/entities/project/model/project-items';
import { ContactStrip } from '@/widgets/contact-strip/ui/contact-strip';
import { HomeHeroScene } from '@/widgets/home-hero-scene/ui/home-hero-scene';
import { ProjectShowcase } from '@/widgets/project-showcase/ui/project-showcase';

/** 홈 화면의 실제 페이지 컨테이너입니다. */
export const HomePage = () => {
  const t = useTranslations('Home');

  return (
    <main style={pageStyle}>
      <HomeHeroScene />
      <ProjectShowcase
        description={t('showcaseDescription')}
        items={projectItems.slice(0, 3)}
        title={t('showcaseTitle')}
      />
      <ContactStrip />
    </main>
  );
};

const pageStyle: CSSProperties = {
  width: 'min(1120px, calc(100% - 2rem))',
  margin: '0 auto',
  padding: '3rem 0 5rem',
  display: 'grid',
  gap: '2rem',
};
