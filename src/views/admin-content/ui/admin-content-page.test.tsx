/* @vitest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react';
import React, { type AnchorHTMLAttributes, type ReactNode } from 'react';

import { AdminContentPage } from '@/views/admin-content/ui/admin-content-page';

import '@testing-library/jest-dom/vitest';

vi.mock('@/i18n/navigation', () => ({
  Link: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('AdminContentPage', () => {
  it('기본적으로 Projects 탭을 열고 정렬 모드에 들어갈 수 있다', () => {
    render(
      <AdminContentPage
        articles={[
          {
            id: 'article-1',
            title: '글 1',
            slug: 'article-1',
            visibility: 'public',
            publish_at: '2026-03-20T09:00:00.000Z',
            thumbnail_url: null,
            created_at: '2026-03-18T09:00:00.000Z',
            updated_at: '2026-03-21T09:00:00.000Z',
            view_count: 42,
          },
        ]}
        projects={[
          {
            id: 'project-1',
            title: '프로젝트 1',
            slug: 'project-1',
            visibility: 'public',
            publish_at: '2026-03-20T09:00:00.000Z',
            display_order: 1,
            thumbnail_url: null,
            created_at: '2026-03-18T09:00:00.000Z',
            updated_at: '2026-03-21T09:00:00.000Z',
          },
          {
            id: 'project-2',
            title: '프로젝트 2',
            slug: 'project-2',
            visibility: 'public',
            publish_at: '2026-03-19T09:00:00.000Z',
            display_order: 2,
            thumbnail_url: null,
            created_at: '2026-03-17T09:00:00.000Z',
            updated_at: '2026-03-20T09:00:00.000Z',
          },
        ]}
      />,
    );

    expect(screen.getByRole('tab', { name: 'Projects' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('프로젝트 1')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '정렬 모드' }));

    expect(screen.getByRole('button', { name: '저장' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '프로젝트 1 아래로 이동' })).toBeTruthy();
  });

  it('Articles 탭에서는 발행일과 조회수를 제목 아래 메타 정보로 보여준다', () => {
    render(
      <AdminContentPage
        articles={[
          {
            id: 'article-1',
            title: '글 1',
            slug: 'article-1',
            visibility: 'public',
            publish_at: '2026-03-20T09:00:00.000Z',
            thumbnail_url: null,
            created_at: '2026-03-18T09:00:00.000Z',
            updated_at: '2026-03-21T09:00:00.000Z',
            view_count: 42,
          },
        ]}
        projects={[]}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Articles' }));

    expect(screen.getByText('2026-03-20')).toBeTruthy();
    expect(screen.getByText('조회수 42')).toBeTruthy();
  });
});
