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
 * 관리자 분석 구형 경로를 메인 대시보드로 정리하는 관리자 라우트 엔트리입니다.
 *
 * `params`는 App Router가 전달하는 비동기 route params이며, 현재 구현에서는
 * `{ locale: string }` 형태를 기대합니다.
 * 함수 내부에서는 먼저 `requireAdmin({ locale })`를 호출해 관리자 인증을 확인합니다.
 * 인증이 실패하면 `requireAdmin`의 정책에 따라 로그인 또는 관리자 보호 경로로 리다이렉트되거나
 * 예외를 던질 수 있으며, 이 함수는 그 흐름을 그대로 따릅니다.
 *
 * 인증이 통과하면 현재 구형 `/admin/analytics` 경로를 `redirect(\`/${locale}/admin\`)`로
 * 정리해 메인 Dashboard로 이동시킵니다.
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
