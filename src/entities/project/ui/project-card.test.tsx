import { render, screen } from '@testing-library/react';
import React, { createElement } from 'react';

import { ProjectCard } from '@/entities/project/ui/project-card';

import '@testing-library/jest-dom/vitest';

vi.mock('next-intl', () => ({
  useLocale: () => 'ko',
  useTranslations: () => (key: string) => (key === 'ongoing' ? '진행 중' : key),
}));

vi.mock('@/shared/ui/content-card/content-card', () => ({
  ContentCard: ({
    ariaLabel,
    href,
    metaItems,
    title,
  }: {
    ariaLabel: string;
    href: string;
    metaItems: string[];
    title: string;
  }) =>
    createElement(
      'a',
      {
        'aria-label': ariaLabel,
        href,
      },
      `${title} ${metaItems.join(' ')}`,
    ),
}));

describe('ProjectCard', () => {
  it('프로젝트 기간과 slug 경로를 사용한다', () => {
    render(
      <ProjectCard
        item={{
          description: '설명',
          id: 'project-1',
          period_end: '2026-02-01T00:00:00.000Z',
          period_start: '2025-12-01T00:00:00.000Z',
          publish_at: '2026-03-01T00:00:00.000Z',
          slug: 'project-slug',
          thumbnail_url: null,
          title: '프로젝트',
        }}
      />,
    );

    expect(screen.getByRole('link', { name: '프로젝트 상세 보기' })).toHaveAttribute(
      'href',
      '/project/project-slug',
    );
    expect(screen.getByText(/2025년 12월/)).toBeTruthy();
    expect(screen.getByText(/2026년 2월/)).toBeTruthy();
  });
});
