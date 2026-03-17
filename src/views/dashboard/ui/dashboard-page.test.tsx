import { render, screen } from '@testing-library/react';
import React from 'react';

import { DashboardPage } from '@/views/dashboard/ui/dashboard-page';

vi.mock('@/views/dashboard/model/get-dashboard-page-data', () => ({
  getDashboardPageData: vi.fn().mockResolvedValue({
    pdfUploadItems: [
      {
        description: '이력서 페이지에서 노출되는 resume PDF를 교체합니다.',
        downloadFileName: 'ParkChaewon-Resume.pdf',
        downloadPath: '/api/pdf/resume',
        filePath: 'ParkChaewon-Resume.pdf',
        isPdfReady: true,
        kind: 'resume',
        title: '이력서 PDF',
      },
      {
        description: '프로젝트 페이지에서 노출되는 포트폴리오 PDF를 교체합니다.',
        downloadFileName: 'ParkChaewon-Portfolio.pdf',
        downloadPath: '/api/pdf/portfolio',
        filePath: 'ParkChaewon-Portfolio.pdf',
        isPdfReady: false,
        kind: 'portfolio',
        title: '포트폴리오 PDF',
      },
    ],
  }),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/features/admin-session/ui/admin-sign-out-button', () => ({
  AdminSignOutButton: ({ submitLabel }: { submitLabel: string }) => <button>{submitLabel}</button>,
}));

vi.mock('@/widgets/admin-pdf-upload', () => ({
  AdminPdfUploadPanel: ({
    initialItems,
  }: {
    initialItems: Array<{
      title: string;
    }>;
  }) => (
    <div>
      {initialItems.map(item => (
        <span key={item.title}>{item.title}</span>
      ))}
    </div>
  ),
}));

describe('DashboardPage', () => {
  it('관리자 작업 링크와 PDF 업로드 섹션을 함께 렌더링한다', async () => {
    render(await DashboardPage({ locale: 'ko' }));

    expect(screen.getByRole('link', { name: '새 기록' }).getAttribute('href')).toBe(
      '/admin/articles/new',
    );
    expect(screen.getByRole('link', { name: '새 프로젝트' }).getAttribute('href')).toBe(
      '/admin/projects/new',
    );
    expect(screen.getByRole('link', { name: '이력서 편집' }).getAttribute('href')).toBe(
      '/admin/resume/edit',
    );
    expect(screen.getByText('이력서 PDF')).toBeTruthy();
    expect(screen.getByText('포트폴리오 PDF')).toBeTruthy();
  });
});
