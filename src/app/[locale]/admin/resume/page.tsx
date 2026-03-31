import type { Metadata } from 'next';
import React from 'react';

import { buildAdminPath } from '@/features/admin-session';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { AdminResumePage } from '@/views/admin-resume';
import { getAdminPdfUploadItems } from '@/widgets/admin-pdf-upload/model/get-admin-pdf-upload-items';

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
};

/**
 * 관리자 resume 허브 페이지입니다.
 * resume 편집 진입과 PDF 파일 관리를 함께 제공합니다.
 */
const AdminResumeRoute = async ({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) => {
  const { locale } = await params;

  await requireAdmin({ locale });

  const pdfUploadItems = await getAdminPdfUploadItems();

  return (
    <AdminResumePage
      pdfUploadItems={pdfUploadItems}
      signOutRedirectPath={buildAdminPath({ locale, section: 'login' })}
    />
  );
};

export default AdminResumeRoute;
