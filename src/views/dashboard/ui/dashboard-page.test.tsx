import { render, screen } from '@testing-library/react';
import React from 'react';

import { DashboardPage } from './dashboard-page';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/features/auth/ui/admin-sign-out-button', () => ({
  AdminSignOutButton: ({ submitLabel }: { submitLabel: string }) => <button>{submitLabel}</button>,
}));

describe('DashboardPage', () => {
  it('관리자 작업 링크를 각 전용 경로로 연결한다', () => {
    render(<DashboardPage locale="ko" />);

    expect(screen.getByRole('link', { name: '새 기록' }).getAttribute('href')).toBe(
      '/admin/articles/new',
    );
    expect(screen.getByRole('link', { name: '새 프로젝트' }).getAttribute('href')).toBe(
      '/admin/projects/new',
    );
    expect(screen.getByRole('link', { name: '이력서 편집' }).getAttribute('href')).toBe(
      '/admin/resume/edit',
    );
  });
});
