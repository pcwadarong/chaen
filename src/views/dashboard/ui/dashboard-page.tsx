import React from 'react';
import { css } from 'styled-system/css';

import { AdminSignOutButton, buildAdminPath } from '@/features/auth';
import { Link } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button/button';

type DashboardPageProps = {
  locale: string;
};

/**
 * 현재 관리자 세션 상태를 확인하고 로그아웃할 수 있는 최소 관리자 페이지입니다.
 */
export const DashboardPage = ({ locale }: DashboardPageProps) => (
  <main className={pageClass}>
    <section aria-labelledby="admin-page-title" className={panelClass}>
      <h1 className={titleClass} id="admin-page-title">
        관리자
      </h1>
      <div className={actionGridClass}>
        <Button asChild fullWidth tone="primary" variant="solid">
          <Link href="/admin/articles/new">새 아티클</Link>
        </Button>
        <Button asChild fullWidth tone="white" variant="ghost">
          <Link href="/admin/projects/new">새 프로젝트</Link>
        </Button>
        <Button asChild fullWidth tone="white" variant="ghost">
          <Link href="/admin/resume/edit">이력서 편집</Link>
        </Button>
        <Button asChild fullWidth tone="white" variant="ghost">
          <Link href="/admin/drafts">임시저장 목록</Link>
        </Button>
      </div>
      <AdminSignOutButton
        redirectPath={buildAdminPath({ locale, section: 'login' })}
        submitLabel="로그아웃"
        submitPendingLabel="로그아웃 중"
      />
    </section>
  </main>
);

const pageClass = css({
  width: 'full',
  px: '4',
  py: '8',
});

const panelClass = css({
  width: '[min(100%, 24rem)]',
  display: 'grid',
  gap: '4',
  mx: 'auto',
});

const actionGridClass = css({
  display: 'grid',
  gap: '3',
});

const titleClass = css({
  m: '0',
  fontSize: '2xl',
  lineHeight: 'tight',
});
