import type { Metadata } from 'next';
import React from 'react';

import { getResumeEditorSeed } from '@/entities/resume/api/resume-editor-read';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { ResumeEditorPage } from '@/views/resume-editor';

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
};

/**
 * 관리자 resume 전용 편집 페이지입니다.
 */
const AdminResumeEditRoute = async ({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) => {
  const { locale } = await params;

  await requireAdmin({ locale });

  const { initialContents, initialPublishSettings, initialSavedAt } = await getResumeEditorSeed();

  return (
    <ResumeEditorPage
      initialContents={initialContents}
      initialPublishSettings={initialPublishSettings}
      initialSavedAt={initialSavedAt}
    />
  );
};

export default AdminResumeEditRoute;
