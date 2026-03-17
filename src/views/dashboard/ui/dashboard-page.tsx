import React from 'react';
import { css } from 'styled-system/css';

import { AdminSignOutButton, buildAdminPath } from '@/features/admin-session';
import { Link } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button/button';
import { getDashboardPageData } from '@/views/dashboard/model/get-dashboard-page-data';
import { AdminPdfUploadPanel } from '@/widgets/admin-pdf-upload';
import { PageSection, PageShell } from '@/widgets/page-shell/ui/page-shell';

type DashboardPageProps = {
  locale: string;
};

/**
 * 현재 관리자 세션 상태를 확인하고 로그아웃할 수 있는 최소 관리자 페이지입니다.
 */
export const DashboardPage = async ({ locale }: DashboardPageProps) => {
  const { pdfUploadItems } = await getDashboardPageData();

  return (
    <PageShell width="compact" hideAppFrameFooter>
      <PageSection>
        <div className={dashboardContentClass}>
          <nav aria-label="관리자 작업" className={actionGridClass}>
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
          </nav>
          <AdminPdfUploadPanel initialItems={pdfUploadItems} />
          <AdminSignOutButton
            redirectPath={buildAdminPath({ locale, section: 'login' })}
            submitLabel="로그아웃"
            submitPendingLabel="로그아웃 중"
          />
        </div>
      </PageSection>
    </PageShell>
  );
};

const dashboardContentClass = css({
  display: 'grid',
  gap: '6',
});

const actionGridClass = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '3',
  '@media (max-width: 520px)': {
    gridTemplateColumns: '1fr',
  },
});
