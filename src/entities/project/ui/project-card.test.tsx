import { render, screen } from '@testing-library/react';
import React, { createElement } from 'react';

import { ProjectCard } from '@/entities/project/ui/project-card';

import '@testing-library/jest-dom/vitest';

vi.mock('next-intl', () => ({
  useLocale: () => 'ko',
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
  it('publish_at이 있으면 그 연도와 slug 경로를 사용한다', () => {
    render(
      <ProjectCard
        item={{
          description: '설명',
          id: 'project-1',
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
    expect(screen.getByText(/2026/)).toBeTruthy();
  });
});
