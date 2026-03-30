import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

import {
  publishEditorContentAction,
  saveEditorDraftAction,
} from '@/entities/editor/api/editor-actions';
import { getEditorSeed } from '@/entities/editor/api/editor-read';
import { getTagOptionsByLocale } from '@/entities/tag/api/query-tags';
import { buildAdminPath } from '@/features/admin-session';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { EditorPage } from '@/views/editor';

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
};

/**
 * 관리자 article 편집 페이지입니다.
 */
const AdminArticleEditRoute = async ({
  params,
}: {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}) => {
  const { id, locale } = await params;

  await requireAdmin({ locale });

  const [availableTags, seed] = await Promise.all([
    getTagOptionsByLocale(locale),
    getEditorSeed({
      contentId: id,
      contentType: 'article',
    }),
  ]);

  if (!seed) {
    notFound();
  }

  const handleDraftSave = async (
    state: Parameters<NonNullable<React.ComponentProps<typeof EditorPage>['onDraftSave']>>[0],
    settings: Parameters<NonNullable<React.ComponentProps<typeof EditorPage>['onDraftSave']>>[1],
    draftId?: string | null,
  ) => {
    'use server';

    return saveEditorDraftAction({
      contentId: id,
      contentType: 'article',
      draftId,
      locale,
      settings,
      state,
    });
  };

  const handlePublishSubmit = async (
    settings: Parameters<
      NonNullable<React.ComponentProps<typeof EditorPage>['onPublishSubmit']>
    >[0],
    editorState: Parameters<
      NonNullable<React.ComponentProps<typeof EditorPage>['onPublishSubmit']>
    >[1],
    draftId?: string | null,
  ) => {
    'use server';

    return publishEditorContentAction({
      contentId: id,
      contentType: 'article',
      draftId,
      editorState,
      locale,
      settings,
    });
  };

  return (
    <EditorPage
      adminChrome={{
        signOutRedirectPath: buildAdminPath({ locale, section: 'login' }),
      }}
      availableTags={availableTags}
      hideAppFrameFooter
      onDraftSave={handleDraftSave}
      onPublishSubmit={handlePublishSubmit}
      {...seed}
    />
  );
};

export default AdminArticleEditRoute;
