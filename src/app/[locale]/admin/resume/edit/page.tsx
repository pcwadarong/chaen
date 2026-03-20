import type { Metadata } from 'next';
import React from 'react';

import {
  publishResumeContentAction,
  saveResumeDraftAction,
} from '@/entities/resume/api/resume-editor-actions';
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
  searchParams,
}: {
  params: Promise<{
    locale: string;
  }>;
  searchParams?: Promise<{
    draftId?: string;
  }>;
}) => {
  const { locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  await requireAdmin({ locale });

  const { initialContents, initialDraftId, initialSavedAt } = await getResumeEditorSeed({
    draftId: resolvedSearchParams?.draftId,
  });

  const handleDraftSave = async (
    state: Parameters<NonNullable<React.ComponentProps<typeof ResumeEditorPage>['onDraftSave']>>[0],
    draftId?: string | null,
  ) => {
    'use server';

    return saveResumeDraftAction({
      draftId,
      locale,
      state,
    });
  };

  const handlePublishSubmit = async (
    state: Parameters<
      NonNullable<React.ComponentProps<typeof ResumeEditorPage>['onPublishSubmit']>
    >[0],
    draftId?: string | null,
  ) => {
    'use server';

    await publishResumeContentAction({
      draftId,
      locale,
      state,
    });
  };

  return (
    <ResumeEditorPage
      hideAppFrameFooter
      initialDraftId={initialDraftId}
      initialContents={initialContents}
      initialSavedAt={initialSavedAt}
      onDraftSave={handleDraftSave}
      onPublishSubmit={handlePublishSubmit}
    />
  );
};

export default AdminResumeEditRoute;
