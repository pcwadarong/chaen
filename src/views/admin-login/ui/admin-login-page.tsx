import React from 'react';

import { AdminLoginForm } from '@/features/auth/ui/admin-login-form';
import { buildAdminPath } from '@/shared/lib/auth/admin-path';

type AdminLoginPageProps = {
  locale: string;
};

/**
 * 관리자 로그인 페이지를 렌더링합니다.
 */
export const AdminLoginPage = ({ locale }: AdminLoginPageProps) => (
  <AdminLoginForm successRedirectPath={buildAdminPath({ locale })} />
);
