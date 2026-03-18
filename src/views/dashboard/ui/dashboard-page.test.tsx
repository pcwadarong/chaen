import { render, screen } from '@testing-library/react';
import React from 'react';

import { DashboardPage } from '@/views/dashboard/ui/dashboard-page';

vi.mock('@/views/dashboard/model/get-dashboard-page-data', () => ({
  getDashboardPageData: vi.fn().mockResolvedValue({
    pdfUploadItems: [
      {
        assetKey: 'resume-ko',
        downloadFileName: 'ParkChaewon-Resume-kr.pdf',
        downloadPath: '/api/pdf/file/resume-ko',
        filePath: 'ParkChaewon-Resume-kr.pdf',
        isPdfReady: false,
        title: '이력서 PDF · 국문',
      },
      {
        assetKey: 'resume-en',
        downloadFileName: 'ParkChaewon-Resume-en.pdf',
        downloadPath: '/api/pdf/file/resume-en',
        filePath: 'ParkChaewon-Resume-en.pdf',
        isPdfReady: true,
        title: '이력서 PDF · 영문',
      },
      {
        assetKey: 'portfolio-ko',
        downloadFileName: 'ParkChaewon-Portfolio-kr.pdf',
        downloadPath: '/api/pdf/file/portfolio-ko',
        filePath: 'ParkChaewon-Portfolio-kr.pdf',
        isPdfReady: false,
        title: '포트폴리오 PDF · 국문',
      },
      {
        assetKey: 'portfolio-en',
        downloadFileName: 'ParkChaewon-Portfolio-en.pdf',
        downloadPath: '/api/pdf/file/portfolio-en',
        filePath: 'ParkChaewon-Portfolio-en.pdf',
        isPdfReady: false,
        title: '포트폴리오 PDF · 영문',
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
  it('관리자 작업 링크와 4개 PDF 업로드 섹션을 함께 렌더링한다', async () => {
    render(await DashboardPage({ locale: 'ko' }));

    expect(screen.getByRole('navigation', { name: '관리자 작업' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '새 기록' }).getAttribute('href')).toBe(
      '/admin/articles/new',
    );
    expect(screen.getByRole('link', { name: '새 프로젝트' }).getAttribute('href')).toBe(
      '/admin/projects/new',
    );
    expect(screen.getByRole('link', { name: '이력서 편집' }).getAttribute('href')).toBe(
      '/admin/resume/edit',
    );
    expect(screen.getByText('이력서 PDF · 국문')).toBeTruthy();
    expect(screen.getByText('이력서 PDF · 영문')).toBeTruthy();
    expect(screen.getByText('포트폴리오 PDF · 국문')).toBeTruthy();
    expect(screen.getByText('포트폴리오 PDF · 영문')).toBeTruthy();
  });
});
