import { css } from '@emotion/react';

import { AdminSignOutButton } from '@/features/auth/ui/admin-sign-out-button';

type AdminPageProps = {
  locale: string;
};

/**
 * 현재 관리자 세션 상태를 확인하고 로그아웃할 수 있는 최소 관리자 페이지입니다.
 */
export const AdminPage = ({ locale }: AdminPageProps) => (
  <main css={pageStyle}>
    <section aria-labelledby="admin-page-title" css={panelStyle}>
      <h1 css={titleStyle} id="admin-page-title">
        관리자
      </h1>
      <AdminSignOutButton
        errorMessage="로그아웃에 실패했습니다."
        redirectPath={`/${locale}/admin/login`}
        submitLabel="로그아웃"
        submitPendingLabel="로그아웃 중"
      />
    </section>
  </main>
);

const pageStyle = css`
  width: 100%;
  padding: var(--space-8) var(--space-4);
`;

const panelStyle = css`
  width: min(100%, 24rem);
  display: grid;
  gap: var(--space-4);
  margin: 0 auto;
`;

const titleStyle = css`
  margin: 0;
  font-size: var(--font-size-24);
  line-height: 1.2;
`;
