/* @vitest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  const articles = [
    {
      id: 'article-1',
      title: '글 1',
      slug: 'article-1',
      visibility: 'public' as const,
      publish_at: '2026-03-20T09:00:00.000Z',
      thumbnail_url: null,
      created_at: '2026-03-18T09:00:00.000Z',
      updated_at: '2026-03-21T09:00:00.000Z',
      view_count: 42,
    },
  ];

  const projects = [
    {
      id: 'project-1',
      title: '프로젝트 1',
      slug: 'project-1',
      visibility: 'public' as const,
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
      visibility: 'public' as const,
      publish_at: '2026-03-19T09:00:00.000Z',
      display_order: 2,
      thumbnail_url: null,
      created_at: '2026-03-17T09:00:00.000Z',
      updated_at: '2026-03-20T09:00:00.000Z',
    },
  ];

  it('프로젝트 탭이 기본 활성 상태일 때, 정렬 모드를 시작하면 저장 액션과 이동 컨트롤이 렌더링되어야 한다', () => {
    render(<AdminContentPage articles={articles} projects={projects} />);

    expect(screen.getByRole('tab', { name: 'Projects' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('프로젝트 1')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '정렬 모드' }));

    expect(screen.getByRole('button', { name: '저장' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '프로젝트 1 아래로 이동' })).toBeTruthy();
  });

  it('정렬 모드에서 순서를 바꾼 뒤 저장하면, 서버 액션은 현재 화면 순서의 프로젝트 id 배열을 받아야 한다', async () => {
    const handleSaveProjectOrder = vi.fn().mockResolvedValue(undefined);

    render(
      <AdminContentPage
        articles={articles}
        onSaveProjectOrder={handleSaveProjectOrder}
        projects={projects}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '정렬 모드' }));
    fireEvent.click(screen.getByRole('button', { name: '프로젝트 1 아래로 이동' }));
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(handleSaveProjectOrder).toHaveBeenCalledWith(['project-2', 'project-1']);
    });
  });

  it('아티클 탭이 활성화되면, 각 항목은 발행일과 조회수를 제목 아래 메타 정보로 노출해야 한다', () => {
    render(<AdminContentPage articles={articles} projects={[]} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Articles' }));

    expect(screen.getByText('2026-03-20')).toBeTruthy();
    expect(screen.getByText('조회수 42')).toBeTruthy();
  });
});
