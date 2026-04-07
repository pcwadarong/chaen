import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { buildAdminPath } from '@/features/admin-session';
import { requireAdmin } from '@/shared/lib/auth/require-admin';

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
};

/**
 * 구형 관리자 분석 경로를 메인 대시보드로 정리합니다.
 */
const AdminAnalyticsRoute = async () => {
  await requireAdmin();
  redirect(buildAdminPath({}));
};

export default AdminAnalyticsRoute;
