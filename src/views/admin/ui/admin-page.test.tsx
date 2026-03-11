import { render, screen } from '@testing-library/react';
import React from 'react';

import { AdminPage } from './admin-page';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/features/auth/ui/admin-sign-out-button', () => ({
  AdminSignOutButton: ({ submitLabel }: { submitLabel: string }) => <button>{submitLabel}</button>,
}));

describe('AdminPage', () => {
  it('새 글 생성 버튼을 관리자 에디터 페이지로 연결한다', () => {
    render(<AdminPage locale="ko" />);

    const createLink = screen.getByRole('link', { name: '새 글 생성' });

    expect(createLink.getAttribute('href')).toBe('/admin/editor');
  });
});
