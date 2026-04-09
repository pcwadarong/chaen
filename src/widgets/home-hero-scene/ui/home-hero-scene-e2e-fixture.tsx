'use client';

import { css } from 'styled-system/css';

import type { ProjectListItem } from '@/entities/project/model/types';
import type { HomeHeroImageViewerItem } from '@/widgets/home-hero-scene/model/home-hero-image-viewer-item';
import { HomeHeroScene } from '@/widgets/home-hero-scene/ui/home-hero-scene';

const HOME_HERO_E2E_PROJECT_ITEMS: ProjectListItem[] = [
  {
    description:
      '실제 canvas keyboard interaction과 scroll coupling을 검증하기 위한 fixture 프로젝트입니다.',
    id: 'motion-library',
    period_end: '2026-03-01',
    period_start: '2025-08-01',
    publish_at: '2026-03-01T00:00:00.000Z',
    slug: 'motion-library',
    thumbnail_url: '/thumbnail.png',
    title: 'Motion Library',
  },
  {
    description: '홈 히어로 프로젝트 프리뷰가 비어 있지 않은 상태를 고정합니다.',
    id: 'scene-atelier',
    period_end: null,
    period_start: '2026-01-10',
    publish_at: '2026-02-14T00:00:00.000Z',
    slug: 'scene-atelier',
    thumbnail_url: '/thumbnail.png',
    title: 'Scene Atelier',
  },
];

const HOME_HERO_E2E_PHOTO_ITEMS: HomeHeroImageViewerItem[] = [
  {
    alt: '작업실 전경 1',
    src: '/thumbnail.png?v=1',
  },
  {
    alt: '작업실 전경 2',
    src: '/thumbnail.png?v=2',
  },
  {
    alt: '작업실 전경 3',
    src: '/thumbnail.png?v=3',
  },
];

/**
 * HomeHeroScene의 실제 브라우저 계약을 검증하기 위한 fixture 화면입니다.
 */
export const HomeHeroSceneE2eFixture = () => (
  <main className={pageClass}>
    <HomeHeroScene
      items={HOME_HERO_E2E_PROJECT_ITEMS}
      locale="ko"
      photoItems={HOME_HERO_E2E_PHOTO_ITEMS}
      title="Selected Projects"
    />
  </main>
);

const pageClass = css({
  minHeight: 'dvh',
});
