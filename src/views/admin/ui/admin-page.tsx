import { css } from 'styled-system/css';

import { AdminSignOutButton } from '@/features/auth/ui/admin-sign-out-button';

type AdminPageProps = {
  locale: string;
};

/**
 * 현재 관리자 세션 상태를 확인하고 로그아웃할 수 있는 최소 관리자 페이지입니다.
 */
export const AdminPage = ({ locale: _locale }: AdminPageProps) => (
  <main className={pageClass}>
    <section aria-labelledby="admin-page-title" className={panelClass}>
      <h1 className={titleClass} id="admin-page-title">
        관리자
      </h1>
      <AdminSignOutButton
        redirectPath="/admin/login"
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

const titleClass = css({
  m: '0',
  fontSize: '2xl',
  lineHeight: 'tight',
});
