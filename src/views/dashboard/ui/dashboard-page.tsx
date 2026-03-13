import React from 'react';
import { css } from 'styled-system/css';

import { AdminSignOutButton, buildAdminPath } from '@/features/auth';
import { Link } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button/button';
import { PageSection, PageShell } from '@/shared/ui/page-shell/page-shell';

type DashboardPageProps = {
  locale: string;
};

/**
 * 현재 관리자 세션 상태를 확인하고 로그아웃할 수 있는 최소 관리자 페이지입니다.
 */
export const DashboardPage = ({ locale }: DashboardPageProps) => (
  <PageShell width="compact" hideAppFrameFooter>
    <PageSection>
      <div className={actionGridClass}>
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
      </div>
      <AdminSignOutButton
        redirectPath={buildAdminPath({ locale, section: 'login' })}
        submitLabel="로그아웃"
        submitPendingLabel="로그아웃 중"
      />
    </PageSection>
  </PageShell>
);

const actionGridClass = css({
  display: 'flex',
  gap: '3',
});
