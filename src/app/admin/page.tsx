import type { Metadata } from 'next';
import React from 'react';

import { getAdminTopArticles } from '@/entities/article/api/list/get-admin-articles';
import { getAdminGoogleArticleTraffic } from '@/entities/article/api/list/get-admin-google-article-traffic';
import type { AdminGoogleArticleTraffic } from '@/entities/article/model/types';
import { getAdminPdfDownloadLogs } from '@/entities/pdf-file/api/get-admin-pdf-download-logs';
import { buildAdminPath } from '@/features/admin-session';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { AdminAnalyticsPage } from '@/views/admin-analytics';

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
};

const FALLBACK_GOOGLE_ARTICLE_TRAFFIC: AdminGoogleArticleTraffic = {
  items: [],
  message: 'Google 아티클 유입 데이터를 불러오지 못했습니다.',
  status: 'error',
  totalClicks: 0,
};

/**
 * 관리자 보호 페이지 엔트리입니다.
 */
const AdminRoute = async () => {
  await requireAdmin();

  const [topArticlesResult, pdfLogsResult, googleArticleTrafficResult] = await Promise.allSettled([
    getAdminTopArticles({ limit: 5 }),
    getAdminPdfDownloadLogs({ limit: 20 }),
    getAdminGoogleArticleTraffic({ limit: 5 }),
  ]);

  const topArticles = topArticlesResult.status === 'fulfilled' ? topArticlesResult.value : [];
  const pdfLogs = pdfLogsResult.status === 'fulfilled' ? pdfLogsResult.value : [];
  const googleArticleTraffic =
    googleArticleTrafficResult.status === 'fulfilled'
      ? googleArticleTrafficResult.value
      : FALLBACK_GOOGLE_ARTICLE_TRAFFIC;

  if (topArticlesResult.status === 'rejected') {
    console.error('[admin] getAdminTopArticles failed', topArticlesResult.reason);
  }

  if (pdfLogsResult.status === 'rejected') {
    console.error('[admin] getAdminPdfDownloadLogs failed', pdfLogsResult.reason);
  }

  if (googleArticleTrafficResult.status === 'rejected') {
    console.error('[admin] getAdminGoogleArticleTraffic failed', googleArticleTrafficResult.reason);
  }

  return (
    <AdminAnalyticsPage
      activeSection="dashboard"
      googleArticleTraffic={googleArticleTraffic}
      pdfLogs={pdfLogs}
      signOutRedirectPath={buildAdminPath({ section: 'login' })}
      title="Dashboard"
      topArticles={topArticles}
    />
  );
};

export default AdminRoute;
