import React from 'react';
import { css } from 'styled-system/css';

import { Link } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button/button';
import { getDashboardPageData } from '@/views/dashboard/model/get-dashboard-page-data';
import { AdminConsoleShell } from '@/widgets/admin-console';
import { AdminPdfUploadPanel } from '@/widgets/admin-pdf-upload';

type DashboardPageProps = {
  locale: string;
};

/**
 * 현재 관리자 세션 상태를 확인하고 로그아웃할 수 있는 최소 관리자 페이지입니다.
 */
export const DashboardPage = async ({ locale }: DashboardPageProps) => {
  const { pdfUploadItems } = await getDashboardPageData();

  return (
    <AdminConsoleShell
      activeSection="dashboard"
      locale={locale}
      summary={
        <nav aria-label="관리자 작업" className={actionGridClass}>
          <Button asChild fullWidth tone="primary" variant="solid">
            <Link href="/admin/content">콘텐츠 관리</Link>
          </Button>
          <Button asChild fullWidth tone="primary" variant="solid">
            <Link href="/admin/articles/new">새 기록</Link>
          </Button>
          <Button asChild fullWidth tone="primary" variant="solid">
            <Link href="/admin/projects/new">새 프로젝트</Link>
          </Button>
          <Button asChild fullWidth tone="black" variant="solid">
            <Link href="/admin/resume/edit">이력서 편집</Link>
          </Button>
          <Button asChild fullWidth tone="white" variant="solid">
            <Link href="/admin/drafts">임시저장 목록</Link>
          </Button>
          <Button asChild fullWidth tone="white" variant="solid">
            <Link href="/admin/photo">사진 관리</Link>
          </Button>
        </nav>
      }
      title="Dashboard"
    >
      <div className={dashboardContentClass}>
        <AdminPdfUploadPanel initialItems={pdfUploadItems} />
      </div>
    </AdminConsoleShell>
  );
};

const dashboardContentClass = css({
  display: 'grid',
  gap: '6',
});

const actionGridClass = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '3',
  _tabletDown: {
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
  _mobileLargeDown: {
    gridTemplateColumns: '1fr',
  },
});
