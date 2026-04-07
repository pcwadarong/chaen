import type { Metadata } from 'next';
import React from 'react';

import { listPhotoFiles } from '@/entities/hero-photo/api/list-photo-files';
import { buildAdminPath } from '@/features/admin-session';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { AdminPhotoPage } from '@/views/admin-photo';

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
};

/**
 * 관리자 사진 보관함 페이지 엔트리입니다.
 */
const AdminPhotoRoute = async () => {
  await requireAdmin();

  const initialItems = await listPhotoFiles();

  return (
    <AdminPhotoPage
      initialItems={initialItems}
      signOutRedirectPath={buildAdminPath({ section: 'login' })}
    />
  );
};

export default AdminPhotoRoute;
