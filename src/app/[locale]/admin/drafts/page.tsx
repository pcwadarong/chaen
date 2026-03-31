import type { Metadata } from 'next';
import React from 'react';

import type { EditorDraftSummary } from '@/entities/editor/api/editor.types';
import { getEditorDraftSummaries } from '@/entities/editor/api/editor-read';
import { deleteEditorDraftAction } from '@/entities/editor/server';
import { buildAdminPath } from '@/features/admin-session';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { EditorDraftsPage } from '@/views/editor-drafts';

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
};

/**
 * 관리자 draft 목록 페이지입니다.
 */
const AdminDraftsRoute = async ({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) => {
  const { locale } = await params;

  await requireAdmin({ locale });

  const items = await getEditorDraftSummaries();
  const handleDeleteDraft = async (
    draftId: string,
    contentType: EditorDraftSummary['contentType'],
  ) => {
    'use server';

    await deleteEditorDraftAction({
      contentType,
      draftId,
      locale,
    });
  };

  return (
    <EditorDraftsPage
      items={items}
      onDeleteDraft={handleDeleteDraft}
      signOutRedirectPath={buildAdminPath({ locale, section: 'login' })}
    />
  );
};

export default AdminDraftsRoute;
