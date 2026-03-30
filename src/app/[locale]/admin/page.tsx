import type { Metadata } from 'next';
import React from 'react';

import { getAdminTopArticles } from '@/entities/article/api/list/get-admin-articles';
import { getAdminPdfDownloadLogs } from '@/entities/pdf-file/api/get-admin-pdf-download-logs';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { AdminAnalyticsPage } from '@/views/admin-analytics';

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

  const [topArticles, pdfLogs] = await Promise.all([
    getAdminTopArticles({ limit: 5, locale }),
    getAdminPdfDownloadLogs({ limit: 20 }),
  ]);

  return (
    <AdminAnalyticsPage
      activeSection="dashboard"
      locale={locale}
      pdfLogs={pdfLogs}
      title="Dashboard"
      topArticles={topArticles}
    />
  );
};

export default AdminRoute;
