import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import React from 'react';

import { AdminPage, getAdminPageData } from '@/views/admin';

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
};

/**
 * 관리자 보호 페이지 엔트리입니다.
 */
const AdminRoute = async ({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) => {
  const { locale } = await params;
  const pageData = await getAdminPageData({ locale });

  if (pageData.redirectPath) {
    redirect(pageData.redirectPath);
  }

  return <AdminPage locale={locale} />;
};

export default AdminRoute;
