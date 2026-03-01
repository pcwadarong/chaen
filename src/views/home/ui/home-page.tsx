'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import { projectItems } from '@/entities/project/model/project-items';
import { ContactStrip } from '@/widgets/contact-strip/ui/contact-strip';
import { homeHeroWebUiLayout } from '@/widgets/home-hero-scene/model/home-hero-web-ui-layout';
import { HomeHeroScene } from '@/widgets/home-hero-scene/ui/home-hero-scene';
import { ProjectShowcase } from '@/widgets/project-showcase/ui/project-showcase';

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
      <section style={showcaseBridgeStyle}>
        <ProjectShowcase
          description={t('showcaseDescription')}
          hideHeader
          items={featuredItems}
          title={t('showcaseTitle')}
        />
      </section>
      <ContactStrip />
    </main>
  );
};

const pageStyle: CSSProperties = {
  width: homeHeroWebUiLayout.containerWidth,
  margin: '0 auto',
  padding: '3rem 0 5rem',
  display: 'grid',
  gap: '0',
};

const showcaseBridgeStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  marginTop: `calc(${homeHeroWebUiLayout.showcaseOverlap} * -1)`,
  paddingTop: homeHeroWebUiLayout.showcaseOverlap,
};
