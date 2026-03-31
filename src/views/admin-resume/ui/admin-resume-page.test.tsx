/* @vitest-environment jsdom */

import { render, screen } from '@testing-library/react';
import React, { type ReactNode } from 'react';

import { AdminResumePage } from '@/views/admin-resume/ui/admin-resume-page';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/widgets/admin-console', () => ({
  AdminConsoleShell: ({
    action,
    children,
    title,
  }: {
    action?: ReactNode;
    children: ReactNode;
    title: ReactNode;
  }) => (
    <section>
      <h1>{title}</h1>
      <div>{action}</div>
      <div>{children}</div>
    </section>
  ),
}));

vi.mock('@/widgets/admin-pdf-upload', () => ({
  AdminPdfUploadPanel: () => <div>pdf-panel</div>,
}));

describe('AdminResumePage', () => {
  it('항상, AdminResumePage는 이력서 편집 CTA 하나와 PDF 관리 패널만 보여줘야 한다', () => {
    render(<AdminResumePage pdfUploadItems={[]} />);

    expect(screen.getByRole('link', { name: '이력서 편집' }).getAttribute('href')).toBe(
      '/admin/resume/edit',
    );
    expect(screen.getByText('pdf-panel')).toBeTruthy();
    expect(screen.queryByText('Resume 작업')).toBeNull();
  });
});
