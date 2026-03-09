import { useTranslations } from 'next-intl';
import React from 'react';
import { css } from 'styled-system/css';

import type { ProjectListItem } from '@/entities/project/model/types';
import { homeHeroWebUiLayout } from '@/widgets/home-hero-scene/model/home-hero-web-ui-layout';
import { ProjectShowcase } from '@/widgets/project-showcase/ui/project-showcase';

type HomeHeroWebUiProps = {
  readonly items: ProjectListItem[];
  readonly title: string;
  readonly wrapperRef?: React.RefObject<HTMLDivElement | null>;
};

/** 3D 캔버스 위에서 페이드 인되는 실제 HTML UI 레이어입니다. */
export const HomeHeroWebUi = ({ items, title, wrapperRef }: HomeHeroWebUiProps) => {
  const t = useTranslations('Home');
  return (
    <div className={wrapperClass} id="web-ui" ref={wrapperRef}>
      <div className={gridBridgeClass}>
        <div className={contentClass}>
          <ProjectShowcase
            description={t('showcaseScreenReaderDescription')}
            descriptionVisibility="sr-only"
            emptyText={t('emptyProjects')}
            items={items}
            hideHeader
            title={title}
          />
        </div>
      </div>
    </div>
  );
};

const wrapperClass = css({
  position: 'absolute',
  inset: '0',
  zIndex: '2',
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'center',
  padding:
    '[clamp(var(--space-18), 8vh, var(--space-24)) var(--space-0) clamp(var(--space-8), 5vh, var(--space-12))]',
  opacity: '0',
  pointerEvents: 'none',
  willChange: 'opacity, transform',
});

const gridBridgeClass = css({
  width: 'full',
  minHeight: 'full',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const contentClass = css({
  width: `[${homeHeroWebUiLayout.containerWidth}]`,
});
