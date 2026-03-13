import type { Metadata } from 'next';
import React from 'react';

import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { DashboardPage } from '@/views/dashboard';

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
  await requireAdmin({ locale });

  return <DashboardPage locale={locale} />;
};

export default AdminRoute;
