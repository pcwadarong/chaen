'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import type { Project } from '@/entities/project/model/types';
import { ContactStrip } from '@/widgets/contact-strip/ui/contact-strip';
import { HomeHeroScene } from '@/widgets/home-hero-scene/ui/home-hero-scene';
import { ProjectShowcase } from '@/widgets/project-showcase/ui/project-showcase';

type HomePageProps = {
  items: Project[];
};

/** 홈 화면의 실제 페이지 컨테이너입니다. */
export const HomePage = ({ items }: HomePageProps) => {
  const t = useTranslations('Home');

  return (
    <main style={pageStyle}>
      <HomeHeroScene />
      <ProjectShowcase
        description={t('showcaseScreenReaderDescription')}
        descriptionVisibility="sr-only"
        emptyText={t('emptyProjects')}
        items={items}
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
