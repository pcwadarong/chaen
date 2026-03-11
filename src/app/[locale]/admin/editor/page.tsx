import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import React from 'react';

import { AdminEditorPage, getAdminEditorPageData } from '@/views/admin-editor';

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
};

/**
 * 관리자 전용 에디터 보호 라우트입니다.
 */
const AdminEditorRoute = async ({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) => {
  const { locale } = await params;
  const pageData = await getAdminEditorPageData({ locale });

  if (pageData.redirectPath) {
    redirect(pageData.redirectPath);
  }

  return <AdminEditorPage availableTags={pageData.availableTags} locale={locale} />;
};

export default AdminEditorRoute;
