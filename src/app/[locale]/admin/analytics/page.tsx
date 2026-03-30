import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/shared/lib/auth/require-admin';

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
};

/**
 * 관리자 분석 구형 경로를 메인 대시보드로 정리합니다.
 */
const AdminAnalyticsRoute = async ({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) => {
  const { locale } = await params;

  await requireAdmin({ locale });
  redirect(`/${locale}/admin`);
};

export default AdminAnalyticsRoute;
