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
 */
const AdminResumeRoute = async () => {
  await requireAdmin();

  const pdfUploadItems = getAdminPdfUploadItems();

  return (
    <AdminResumePage
      pdfUploadItems={pdfUploadItems}
      signOutRedirectPath={buildAdminPath({ section: 'login' })}
    />
  );
};

export default AdminResumeRoute;
