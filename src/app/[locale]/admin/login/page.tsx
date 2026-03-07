import { redirect } from 'next/navigation';
import React from 'react';

import { AdminLoginPage, getAdminLoginPageData } from '@/views/admin-login';

/**
 * 관리자 로그인 페이지 엔트리입니다.
 */
const AdminLoginRoute = async ({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) => {
  const { locale } = await params;
  const pageData = await getAdminLoginPageData({ locale });

  if (pageData.redirectPath) {
    redirect(pageData.redirectPath);
  }

  return <AdminLoginPage locale={locale} />;
};

export default AdminLoginRoute;
