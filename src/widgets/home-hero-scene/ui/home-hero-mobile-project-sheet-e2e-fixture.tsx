'use client';

import React, { useRef, useState } from 'react';
import { css } from 'styled-system/css';

import type { ProjectListItem } from '@/entities/project/model/types';
import { Button } from '@/shared/ui/button/button';
import { HomeHeroMobileProjectSheet } from '@/widgets/home-hero-scene/ui/home-hero-mobile-project-sheet';

const FIXTURE_PROJECT_ITEMS: ProjectListItem[] = [
  {
    description: '브라우저 dialog 포커스 흐름을 검증하기 위한 fixture 프로젝트입니다.',
    id: 'fixture-project-1',
    period_end: '2026-03-01',
    period_start: '2026-01-01',
    publish_at: '2026-03-01T00:00:00.000Z',
    slug: 'fixture-project-1',
    thumbnail_url: null,
    title: '테스트 프로젝트',
  },
];

/**
 * HomeHeroMobileProjectSheet의 dialog 포커스 흐름을 검증하기 위한 fixture입니다.
 */
export const HomeHeroMobileProjectSheetE2eFixture = () => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <main className={pageClass}>
      <section className={panelClass}>
        <h1 className={titleClass}>HomeHeroMobileProjectSheet Browser Fixture</h1>
        <p className={descriptionClass}>
          trigger에서 열기, dialog 진입 포커스, Tab 순환, Escape 닫힘 후 포커스 복귀를 검증한다.
        </p>
        <div className={controlsClass}>
          <Button
            onClick={() => setIsOpen(true)}
            ref={triggerRef}
            size="sm"
            tone="primary"
            type="button"
          >
            프로젝트 패널 열기
          </Button>
          <Button size="sm" tone="white" type="button" variant="ghost">
            바깥 보조 버튼
          </Button>
        </div>
      </section>
      <HomeHeroMobileProjectSheet
        isOpen={isOpen}
        items={FIXTURE_PROJECT_ITEMS}
        onClose={() => setIsOpen(false)}
        title="선택된 프로젝트"
      />
    </main>
  );
};

const pageClass = css({
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  px: '5',
  py: '8',
  background:
    '[linear-gradient(180deg, color-mix(in srgb, #5d5bff 10%, white) 0%, color-mix(in srgb, #5d5bff 4%, white) 100%)]',
});

const panelClass = css({
  width: 'full',
  maxWidth: '[24rem]',
  display: 'grid',
  gap: '4',
  p: '5',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderColor: 'border',
  background: 'surface',
  boxShadow: 'lg',
});

const titleClass = css({
  fontSize: 'xl',
  fontWeight: 'semibold',
  color: 'text',
});

const descriptionClass = css({
  fontSize: 'sm',
  color: 'muted',
});

const controlsClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',
});
