import React from 'react';

import { AdminLoginForm, buildAdminPath } from '@/features/admin-session';

/**
 * 관리자 로그인 페이지를 렌더링합니다.
 */
export const LoginPage = () => <AdminLoginForm successRedirectPath={buildAdminPath({})} />;
