'use client';

import { css } from '@emotion/react';
import { useTranslations } from 'next-intl';
import React from 'react';

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
    <div id="web-ui" ref={wrapperRef} css={wrapperStyle}>
      <div css={gridBridgeStyle}>
        <div css={contentStyle}>
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

const wrapperStyle = css`
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: clamp(var(--space-18), 8vh, var(--space-24)) var(--space-0)
    clamp(var(--space-8), 5vh, var(--space-12));
  opacity: 0;
  pointer-events: none;
  will-change: opacity, transform;
`;

const gridBridgeStyle = css`
  width: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const contentStyle = css`
  width: ${homeHeroWebUiLayout.containerWidth};
`;
